/**
 * 為 golf_courses.json 每筆球場加入 name_en / name_ja / name_ko
 * 翻譯依據國際賽事慣用名稱 + 官網英文名
 * 執行: node scripts/add-translations.js
 */
import fs from 'fs'

const TRANSLATIONS = {
  '翡翠':           { name_en: 'Jade',                         name_ja: '翡翠',                         name_ko: '제이드' },
  '黃金海岸(北海)': { name_en: 'Gold Coast (Peihai)',           name_ja: 'ゴールドコースト（北海）',       name_ko: '골드 코스트 (북해)' },
  '濱海':           { name_en: 'Binhai',                        name_ja: '濱海',                         name_ko: '빈하이' },
  '大屯':           { name_en: 'Tatun',                         name_ja: '大屯',                         name_ko: '따툰' },
  '台灣(老淡水)':   { name_en: 'Taiwan (Old Tamsui)',           name_ja: '台湾（老淡水）',                name_ko: '타이완 (올드 탐수이)' },
  '揮皇(新淡水)':   { name_en: 'Huihuang (New Tamsui)',         name_ja: '揮皇（新淡水）',                name_ko: '후이황 (신 탐수이)' },
  '國華':           { name_en: 'Kuo Hua',                       name_ja: '国華',                         name_ko: '궈화' },
  '八里國際':       { name_en: 'Bali International',            name_ja: '八里インターナショナル',         name_ko: '바리 인터내셔널' },
  '美麗華':         { name_en: 'Miramar',                       name_ja: 'ミラマー',                     name_ko: '미라마' },
  '幸福':           { name_en: 'Hsingfu',                       name_ja: '幸福',                         name_ko: '싱푸' },
  '東華':           { name_en: 'Tung Hua',                      name_ja: '東華',                         name_ko: '둥화' },
  '林口':           { name_en: 'Linkou',                        name_ja: '林口',                         name_ko: '린커우' },
  '台北':           { name_en: 'Taipei',                        name_ja: '台北',                         name_ko: '타이베이' },
  '統帥':           { name_en: 'Commander',                     name_ja: 'コマンダー',                   name_ko: '커맨더' },
  '第一':           { name_en: 'Formosa',                       name_ja: 'フォルモサ',                   name_ko: '포르모사' },
  '永漢':           { name_en: 'Yung Han',                      name_ja: '永漢',                         name_ko: '융한' },
  '長庚':           { name_en: 'Chang Gung',                    name_ja: 'チャングン',                   name_ko: '창궁' },
  '東方':           { name_en: 'Orient',                        name_ja: 'オリエント',                   name_ko: '오리엔트' },
  '大溪':           { name_en: 'Tashee',                        name_ja: 'タシー',                       name_ko: '타시' },
  '桃園':           { name_en: 'Taoyuan',                       name_ja: '桃園',                         name_ko: '타오위안' },
  '龍潭':           { name_en: 'Lungtan',                       name_ja: '龍潭',                         name_ko: '룽탄' },
  '揚昇':           { name_en: 'Sunrise',                       name_ja: 'サンライズ',                   name_ko: '선라이즈' },
  '楊梅':           { name_en: 'Yangmei',                       name_ja: '楊梅',                         name_ko: '양메이' },
  '礁溪':           { name_en: 'Jiaoxi',                        name_ja: '礁渓',                         name_ko: '자오시' },
  '花蓮':           { name_en: 'Hualien',                       name_ja: '花蓮',                         name_ko: '화련' },
  '長安':           { name_en: 'Chang An',                      name_ja: '長安',                         name_ko: '창안' },
  '再興':           { name_en: 'Zai-Shing',                     name_ja: '再興',                         name_ko: '재싱' },
  '新竹(新豐)':     { name_en: 'Hsinchu (Hsinfeng)',            name_ja: '新竹（新豊）',                  name_ko: '신주 (신펑)' },
  '立益':           { name_en: 'Lily',                          name_ja: 'リリー',                       name_ko: '릴리' },
  '旭陽':           { name_en: 'Sungold Valley',                name_ja: 'サンゴールドバレー',            name_ko: '선골드 밸리' },
  '老爺關西':       { name_en: 'Royal Kuansi',                  name_ja: 'ロイヤル関西',                 name_ko: '로열 관시' },
  '山溪地':         { name_en: 'Sun City',                      name_ja: 'サンシティ',                   name_ko: '선 시티' },
  '寶山':           { name_en: 'Pao-Shan',                      name_ja: '宝山',                         name_ko: '바오산' },
  '東方之星':       { name_en: 'Star of the East',              name_ja: 'スター・オブ・ザ・イースト',    name_ko: '스타 오브 더 이스트' },
  '皇家':           { name_en: 'Royal',                         name_ja: 'ロイヤル',                     name_ko: '로열' },
  '全國':           { name_en: 'National',                      name_ja: 'ナショナル',                   name_ko: '내셔널' },
  '清泉崗(CCK)':    { name_en: 'Ching Chuan Kang (CCK)',        name_ja: 'チンチュアンカン（CCK）',       name_ko: '칭취안강 (CCK)' },
  '豐原':           { name_en: 'Fengyuan',                      name_ja: '豊原',                         name_ko: '펑위안' },
  '台中(興農)':     { name_en: 'Taichung (Hsing Nung)',         name_ja: '台中（興農）',                 name_ko: '타이중 (싱눙)' },
  '台中國際':       { name_en: 'Taichung International',        name_ja: '台中インターナショナル',        name_ko: '타이중 인터내셔널' },
  '鴻禧太平':       { name_en: 'Sunrise Taiping',               name_ja: 'サンライズ太平',               name_ko: '선라이즈 타이핑' },
  '霧峰':           { name_en: 'Wufeng',                        name_ja: '霧峰',                         name_ko: '우펑' },
  '台豐':           { name_en: 'Tai Fong',                      name_ja: '台豊',                         name_ko: '타이펑' },
  '彰化':           { name_en: 'Changhua',                      name_ja: '彰化',                         name_ko: '장화' },
  '南峰':           { name_en: 'Nanfeng',                       name_ja: '南峰',                         name_ko: '난펑' },
  '松柏嶺(南投) ':  { name_en: 'Sung Po Ling (Nantou)',         name_ja: '松柏嶺（南投）',               name_ko: '쑹보링 (난터우)' },
  '棕梠湖(東洋)':   { name_en: 'Palm Lakes (Tung Yang)',        name_ja: 'パームレイク（東洋）',          name_ko: '팜 레이크 (동양)' },
  '嘉光':           { name_en: 'Chia Kuang',                    name_ja: '嘉光',                         name_ko: '자광' },
  '斑芝花(永安)':   { name_en: 'Bauhinia (Yung An)',            name_ja: 'バウヒニア（永安）',            name_ko: '바우히니아 (융안)' },
  '嘉南':           { name_en: 'Chianan',                       name_ja: '嘉南',                         name_ko: '자난' },
  '南寶':           { name_en: 'Nanbao',                        name_ja: '南宝',                         name_ko: '남바오' },
  '台南(新化)':     { name_en: 'Tainan (Hsinhua)',              name_ja: '台南（新化）',                 name_ko: '타이난 (신화)' },
  '南一':           { name_en: 'Nan-Yi',                        name_ja: '南一',                         name_ko: '난이' },
  '大崗山':         { name_en: 'Dagangshan',                    name_ja: '大岡山',                       name_ko: '다강산' },
  '高雄(澄清湖)':   { name_en: 'Kaohsiung (Chengcing Lake)',    name_ja: '高雄（澄清湖）',               name_ko: '가오슝 (청칭 호수)' },
  '觀音山':         { name_en: 'Guanyin Mountain',              name_ja: '観音山',                       name_ko: '관음산' },
  '信誼':           { name_en: 'Hsin-Yi',                       name_ja: '信誼',                         name_ko: '신이' },
  '山湖觀':         { name_en: 'Mountain Lake View',            name_ja: 'マウンテンレイクビュー',        name_ko: '마운틴 레이크 뷰' },
}

const DATA_PATH = './src/data/golf_courses.json'
const courses = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

let matched = 0
let missing = []

const updated = courses.map(c => {
  const t = TRANSLATIONS[c.name]
  if (!t) { missing.push(c.name); return c }
  matched++
  const { name, ...rest } = c
  return { name, name_en: t.name_en, name_ja: t.name_ja, name_ko: t.name_ko, ...rest }
})

fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2))
console.log(`✅ 翻譯完成！共更新 ${matched} 筆`)
if (missing.length) console.warn('⚠️  未找到翻譯的球場:', missing)
