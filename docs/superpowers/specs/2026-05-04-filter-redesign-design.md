# Filter 重設計 & 元件拆分 Design Spec

**日期：** 2026-05-04  
**狀態：** 已核准

---

## 一、目標

1. 將 Filter Bar 重設計成圖片所示樣式（PC chips 列 + 手機下拉 sheet）
2. 新增「看身分」（來賓/會員/同組/團體）+ 「看日期」（平日/假日）篩選，自動決定排序欄位
3. 新增預算上限滑桿
4. 新增視圖切換：表格 / 卡片（地圖暫不實作）
5. 將 Home.vue 拆分成多個子元件，各檔案目標 400 行以下

---

## 二、元件架構

```
src/
├── pages/
│   └── Home.vue                  # ~250 行：狀態、路由、lifecycle、filteredCourses
├── components/
│   ├── FilterBar.vue             # ~300 行：PC 兩行 filter + 手機 sheet
│   ├── CourseTable.vue           # ~200 行：桌機表格視圖
│   ├── CourseCards.vue           # ~200 行：卡片網格視圖
│   ├── AboutModal.vue            # ~150 行：關於 modal
│   └── InstallGuideModal.vue     # ~150 行：加入主畫面 modal
```

**溝通方式：**
- Home.vue 透過 props 傳資料給子元件
- 子元件透過 emit 回傳狀態變更給 Home.vue
- filteredCourses computed 留在 Home.vue

---

## 三、Filter Bar UI

### PC（兩行，sticky）

```
Row 1:
[ 🔍 搜尋球場名稱或地區，例如：林口、海景、Nicklaus ]   [ ≡ 表格 ][ ⊞ 卡片 ]

Row 2:
[ 全部 26 ][ 台北新北 8 ][ 桃園 8 ][ 新竹苗栗 3 ][ 中彰投 3 ][ 嘉南高屏 4 ][ 花東 2 ]
看身分：[ 來賓 ][ 會員 ][ 同組 ][ 團體 ]   看日期：[ 平日 ][ 假日 ]   預算上限：────●── $4,400
```

- 地區 chips：點擊觸發 URL 導航（保留 SEO）
- 身分 / 日期 chips：client-side state，emerald 高亮選取狀態
- 預算滑桿：max 值取自所有球場資料中該 priceField 欄位的最高值（不受其他篩選影響），default = max（不過濾）
- 視圖切換按鈕：狀態存 localStorage (`golffee_view`)

### 手機

```
Row 1:
[ 🔍 搜尋球場...                              ][ 篩選 2▼ ]
```

點「篩選」開啟底部 sheet，包含：
- 地區（select 下拉，選後 URL 導航）
- 看身分（select：來賓 / 會員 / 同組 / 團體）
- 看日期（select：平日 / 假日）
- 球場日（select：全部 / 週一 ... 週日）← PC 版不顯示此選項
- 預算上限（range slider）
- 最愛（toggle button）
- 重置按鈕（恢復所有預設值）

篩選按鈕的 badge 數字 = 非預設的選項數量（不含地區、不含搜尋）

---

## 四、狀態設計

### 新增

```js
const selectedIdentity = ref('guest')   // 'guest' | 'member' | 'mGuest' | 'team'
const selectedDay = ref('weekday')      // 'weekday' | 'holiday'
const maxBudget = ref(Infinity)         // 預算上限，Infinity = 不過濾
const viewMode = ref(                   // 'table' | 'card'，localStorage 持久化
  localStorage.getItem('golffee_view') || 'table'
)
const showMobileFilter = ref(false)     // 手機篩選 sheet 開關
```

### 移除

```js
// 移除 sortBy（由 identity+day 自動決定）
// 移除 selectedGolfDay（移進 mobileFilter sheet，手機專用）
// 移除 showFilterPanel（改名 showMobileFilter）
```

### priceField computed

```js
const priceField = computed(() => {
  if (selectedIdentity.value === 'member') return 'member'
  const dayKey = selectedDay.value === 'weekday' ? 'Weekday' : 'Holiday'
  const map = { guest: 'guest', mGuest: 'memberGuest', team: 'team' }
  return map[selectedIdentity.value] + dayKey
})
```

### filteredCourses 變更

- 排序依據改為 `priceField.value`
- 加入預算過濾：`parseNum(c[priceField.value]) <= maxBudget.value`
- 球場日篩選保留（手機 sheet 控制）

---

## 五、視圖切換

- PC 與手機都支援 表格 / 卡片 兩種視圖
- 原本 `hidden xl:block`（表格）/ `xl:hidden`（卡片）改為由 `viewMode` 控制
- viewMode 存入 localStorage，刷新後維持

---

## 六、身分＋日期 → 價格欄位對應

| 身分 | 平日 | 假日 |
|------|------|------|
| 來賓 | guestWeekday | guestHoliday |
| 會員 | member | member |
| 同組 | memberGuestWeekday | memberGuestHoliday |
| 團體 | teamWeekday | teamHoliday |

卡片視圖中，對應欄位的標籤置頂並以 emerald 顏色高亮。
表格視圖中，對應欄位的標題加底線或顏色標示。

---

## 七、RWD 斷點

- 手機 filter：< lg（< 1024px）
- PC filter：>= lg（>= 1024px）
- 卡片網格：手機 1 欄 / md 2 欄 / lg 3 欄（當選卡片視圖時）
- 表格：所有尺寸皆可用（當選表格視圖時）

---

## 八、不在範圍內

- 地圖視圖（暫不實作，需補 geo 座標）
- 多語系翻譯新增（dict 已有框架，新 key 補上即可）
- 球場資料異動
