import fs from 'fs';
import https from 'https';

// 1. 這裡放你原始的 GAS 網址（不要自己手動加 ?t=）
const BASE_GAS_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMUpTloWvl5fEEeZ19T6nayiSaC_I5SpXdEfeBxtQ7yHwp57tRuIlbzlQgfhgALOoFW2Xo2l52RBEmtn0sGiXfiLVwRyC2Hqqa2zIoCyblZxByIGesujOYhebo9S4vGhiEYgLTl8HLFNdDX1xi7-nZSyJGo9Vx7PJkwYdUM9JkBaRdgzgjFLGiTB7YHGLP8BzPspG-a_7lpdh6czo_QFFcrOIOnoOUlTJfemoR9kAa5Tmoylgjto36HJjHhYMH2L3gYxpf4fH-y8t3m06Pvs7BP6SmBFkA&lib=Ml_fC5Wgu3ANRQr1wcNFb1wf7GyclGhez';

function fetchData(url) {
    // 2. 在這裡動態加上時間戳記，並處理編碼
    const urlObj = new URL(url);
    urlObj.searchParams.set('t', Date.now().toString()); // 只用數字時間戳，避免空格
    const finalUrl = urlObj.toString();

    console.log('正在請求資料...');

    https.get(finalUrl, (res) => {
        // 處理 302 轉址
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log('重新導向中...');
            // 轉址時，Google 會給出完整的新 URL，直接用那個抓就好
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
                process.exit(0);
            } catch (e) {
                console.error('❌ 解析 JSON 失敗。');
                console.log('收到的內容（前100字）：', data.substring(0, 100));
                process.exit(1);
            }
        });
    }).on('error', (err) => {
        console.error('❌ 網路請求失敗: ' + err.message);
        process.exit(1);
    });
}

fetchData(BASE_GAS_URL);