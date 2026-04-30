import fs from 'fs';
import https from 'https';
import { config } from 'dotenv';

config();

const BASE_GAS_URL = process.env.GAS_READ_URL;

if (!BASE_GAS_URL) {
    console.error('❌ 缺少環境變數 GAS_READ_URL，請確認 .env 檔案。');
    process.exit(1);
}

function fetchData(url) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('t', Date.now().toString());
    const finalUrl = urlObj.toString();

    console.log('正在請求資料...');

    https.get(finalUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log('重新導向中...');
            return fetchData(res.headers.location);
        }

        let chunks = [];
        res.on('data', (chunk) => { chunks.push(chunk); });
        res.on('end', () => {
            try {
                const data = Buffer.concat(chunks).toString('utf8');
                const parsed = JSON.parse(data);

                // 若 GAS 尚未加入多語系欄位，保留本地翻譯（name_en / name_ja / name_ko）
                let existing = []
                try { existing = JSON.parse(fs.readFileSync('./src/data/golf_courses.json', 'utf8')) } catch {}
                const localMap = {}
                existing.forEach(c => { if (c.name_en) localMap[c.name] = { name_en: c.name_en, name_ja: c.name_ja, name_ko: c.name_ko } })
                const merged = parsed.map(c => {
                    if (c.name_en) return c              // GAS 已有翻譯，直接用
                    if (localMap[c.name]) {              // 用本地翻譯補齊
                        const { name, ...rest } = c
                        return { name, ...localMap[c.name], ...rest }
                    }
                    return c
                })

                fs.writeFileSync('./src/data/golf_courses.json', JSON.stringify(merged, null, 2));
                console.log('✅ 資料更新成功！共抓取 ' + (Array.isArray(merged) ? merged.length : 1) + ' 筆球場資料。');

                const today = new Date().toISOString().slice(0, 10);
                const regionSlugs = ['taipei', 'taoyuan', 'hsinchu', 'taichung', 'tainan', 'hualien'];
                const regionUrls = regionSlugs.map(slug => `  <url>
    <loc>https://golffee.vercel.app/region/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');
                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://golffee.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${regionUrls}
</urlset>\n`;
                fs.writeFileSync('./public/sitemap.xml', sitemap);
                console.log('✅ sitemap.xml 已更新 lastmod 為 ' + today);

                process.exit(0);
            } catch (e) {
                console.error('❌ 解析 JSON 失敗。');
                process.exit(1);
            }
        });
    }).on('error', (err) => {
        console.error('❌ 網路請求失敗: ' + err.message);
        process.exit(1);
    });
}

fetchData(BASE_GAS_URL);
