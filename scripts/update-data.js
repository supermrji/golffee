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
                fs.writeFileSync('./src/data/golf_courses.json', JSON.stringify(parsed, null, 2));
                console.log('✅ 資料更新成功！共抓取 ' + (Array.isArray(parsed) ? parsed.length : 1) + ' 筆球場資料。');

                const today = new Date().toISOString().slice(0, 10);
                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://golffee.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
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
