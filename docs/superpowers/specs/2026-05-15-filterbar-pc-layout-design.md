# FilterBar PC Layout Redesign

**Date:** 2026-05-15  
**Status:** Approved

## Problem

PC 版篩選列（Row 2）使用 `flex-wrap`，在中大尺寸螢幕會隨機斷行，視覺凌亂。「我的最愛」按鈕埋在一排 chips 最右端，樣式與其他篩選 chip 相同，不夠醒目。

## Final Design

### PC 三行結構（`lg:` 以上）

**Row 1（既有，加入最愛）**
```
[ 搜尋框 (flex-1) ]  [ ☰ 表格 | ⊞ 卡片 ]  [ ♡ 我的最愛 ]
```
- 最愛按鈕緊貼 view toggle 右邊，高度 `h-10` 齊平
- 未啟用：`border border-white/10 text-[#888]`
- 已啟用：`bg-emerald-400 text-black font-bold border-emerald-400`（底色填滿，最顯眼）

**Row 2（地區，重構）**
```
[ 全部 ][ 台北市、新北市 ][ 桃園地區 ][ 新竹、苗栗 ][ 台中、彰化、南投 ][ 嘉義、台南、高雄、屏東 ][ 花東地區 ]
```
- `flex-nowrap`，靠左對齊，不再使用 `flex-wrap`
- 右邊空間自然留白，無任何元素，避免大螢幕空洞感

**Row 3（篩選，重構）**
```
IDENTITY [ 散客 ][ 會員 ][ 帶打 ][ 球隊 ]  |  DAY [ 平日 ][ 假日 ]  |  BUDGET ——— 不限
```
- 身分、平假日、預算獨占一行，視覺清爽
- 不再與地區 chips 混排

### 手機版（不變）
Mobile filter sheet 完全維持現有設計，不受影響。

## Component Changes

### `src/components/FilterBar.vue` — Row 2 區塊

**移除：**
```html
<div class="hidden lg:flex items-center gap-x-4 mt-3 flex-wrap gap-y-2">
  ... (所有內容)
</div>
```

**新增：三個獨立 div**

1. Row 2 — 地區 chips（原本在 Row 2 第一段）
```html
<div class="hidden lg:flex items-center gap-1.5 mt-3">
  <!-- region chips, flex-nowrap（預設），無 flex-wrap -->
</div>
```

2. Row 3 — 身分 + 平假日 + 預算
```html
<div class="hidden lg:flex items-center gap-x-4 mt-2">
  <!-- identity chips | sep | day chips | sep | budget -->
</div>
```

3. Row 1 — 搜尋列末端加入最愛按鈕
```html
<!-- 在現有 Row 1 的 </div> 前插入，緊接 view-toggle 之後 -->
<button @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
        :class="['hidden lg:flex items-center gap-1.5 h-10 px-4 border text-xs tracking-wider transition-all flex-shrink-0',
                 showFavoritesOnly
                   ? 'bg-emerald-400 text-black font-bold border-emerald-400'
                   : 'border-white/10 text-[#888] hover:border-white/25']">
  <Heart :class="['w-3.5 h-3.5', showFavoritesOnly ? 'fill-black' : '']" />
  {{ t.favorites }}
</button>
```

## Key Decisions

| 決策 | 原因 |
|------|------|
| 最愛放 Row 1 而非 Row 2 | 搜尋列空間充裕；大螢幕下 Row 2 不再有奇怪空洞 |
| Row 2 地區 flex-nowrap | 7 個地區 chip 在 lg+ 完全放得下，強制單行 |
| 最愛啟用用實心填滿 | 與其他 chip 的 emerald outline 風格區隔，立即可辨識 |
| Row 3 移除最愛 | 最愛語意上屬於「我要看什麼」而非篩選條件，放 Row 1 更直覺 |
