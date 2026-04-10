import fs from 'fs';
import { config } from 'dotenv';

config();

const GAS_URL = process.env.GAS_UPLOAD_URL;
const SECRET = process.env.GAS_SECRET;
const JSON_FILE_PATH = './src/data/golf_courses.json';

if (!GAS_URL || !SECRET) {
    console.error('❌ 缺少環境變數 GAS_UPLOAD_URL 或 GAS_SECRET，請確認 .env 檔案。');
    process.exit(1);
}

async function uploadData() {
    try {
        console.log('正在讀取本地 JSON 檔案...');

        const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        const jsonData = JSON.parse(rawData);

        console.log(`準備上傳 ${jsonData.length} 筆資料至 Google Sheet...`);

        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ secret: SECRET, data: jsonData }),
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow'
        });

        const result = await response.text();

        if (response.ok) {
            console.log('✅ 伺服器回應:', result);
        } else {
            console.error('❌ 上傳失敗，狀態碼:', response.status);
            console.error('錯誤內容:', result);
        }

    } catch (error) {
        console.error('❌ 執行過程中發生錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

uploadData();
