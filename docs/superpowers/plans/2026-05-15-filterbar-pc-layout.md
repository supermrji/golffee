# FilterBar PC Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重構 PC 版篩選列為固定三行結構，消除 flex-wrap 斷行，並將「我的最愛」按鈕移至 Row 1 view toggle 左側，啟用時底色填滿。

**Architecture:** 只修改 `src/components/FilterBar.vue`，不新增檔案、不動手機版。Row 1 插入最愛按鈕（PC only）；舊的單一 Row 2 拆成兩個獨立 div：Row 2 地區 chips（flex-nowrap）+ Row 3 身分/平假日/預算。

**Tech Stack:** Vue 3 Composition API, Tailwind CSS v4, lucide-vue-next

---

### Task 1：在 Row 1 加入「我的最愛」按鈕（PC only）

**Files:**
- Modify: `src/components/FilterBar.vue:89-100`（view toggle 區塊前插入）

目前 Row 1 的 PC view toggle（`hidden lg:flex`）在第 89 行。在它**之前**插入最愛按鈕。

- [ ] **Step 1: 在 view toggle 前插入按鈕**

找到以下區塊（約第 89 行）：

```html
      <div class="hidden lg:flex items-center border border-white/10 h-10 flex-shrink-0">
        <button @click="$emit('update:viewMode', 'table')"
```

在它**前面**插入：

```html
      <button @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
              :class="['hidden lg:flex items-center gap-1.5 h-10 px-4 border text-xs tracking-wider transition-all flex-shrink-0',
                       showFavoritesOnly
                         ? 'bg-emerald-400 text-black font-bold border-emerald-400'
                         : 'border-white/10 text-[#888] hover:border-white/25']">
        <Heart :class="['w-3.5 h-3.5', showFavoritesOnly ? 'fill-black' : '']" />
        {{ t.favorites }}
      </button>
```

- [ ] **Step 2: 啟動 dev server 確認 Row 1 外觀**

```bash
npm run dev
```

開啟瀏覽器（1280px+ 寬），確認：
- 「我的最愛」按鈕出現在 view toggle **左側**
- 點擊後按鈕變 emerald 底色、黑色文字、愛心填滿
- 再點回復低調外框
- 手機版（< 1024px）看不到此按鈕

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterBar.vue
git commit -m "feat(filterbar): add favorites button to PC Row 1, left of view toggle"
```

---

### Task 2：拆解舊 Row 2 — 地區 chips 獨立一行

**Files:**
- Modify: `src/components/FilterBar.vue:143-193`（整個舊 Row 2 區塊）

舊的 Row 2 是一個 `hidden lg:flex ... flex-wrap` 的 div 包含所有篩選元素。這個 Task 先把地區 chips 單獨抽出來。

- [ ] **Step 1: 將舊 Row 2 div 開頭改為僅放地區 chips**

找到（約第 143 行）：

```html
    <!-- Row 2 (PC only) -->
    <div class="hidden lg:flex items-center gap-x-4 mt-3 flex-wrap gap-y-2">
      <div class="flex items-center gap-1.5 flex-wrap">
        <button v-for="opt in regionOptions" :key="opt.value"
```

將整個舊 Row 2 `<div>` 替換為以下兩個新 div（地區行 + 篩選行）：

```html
    <!-- Row 2 (PC only): 地區 chips -->
    <div class="hidden lg:flex items-center gap-1.5 mt-3">
      <button v-for="opt in regionOptions" :key="opt.value"
              @click="$emit('regionChange', opt.value)"
              :class="['px-2.5 py-1 text-xs border tracking-wider transition-all whitespace-nowrap',
                       selectedRegion === opt.value
                         ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium'
                         : 'border-white/10 text-[#888] hover:border-white/25']">
        {{ opt.label }}<span class="text-[10px] opacity-50 ml-1">{{ opt.count }}</span>
      </button>
    </div>

    <!-- Row 3 (PC only): 身分 + 平假日 + 預算 -->
    <div class="hidden lg:flex items-center gap-x-4 mt-2">
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span class="text-[10px] text-[#555] tracking-widest uppercase whitespace-nowrap">{{ t.identity }}</span>
        <button v-for="opt in identityOptions" :key="opt.value"
                @click="$emit('update:selectedIdentity', opt.value)"
                :class="['px-2.5 py-1 text-xs border tracking-wider transition-all whitespace-nowrap',
                         selectedIdentity === opt.value
                           ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium'
                           : 'border-white/10 text-[#888] hover:border-white/25']">
          {{ t[opt.labelKey] }}
        </button>
      </div>
      <div class="w-px h-4 bg-white/10 flex-shrink-0"></div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span class="text-[10px] text-[#555] tracking-widest uppercase whitespace-nowrap">{{ t.day }}</span>
        <button v-for="opt in dayOptions" :key="opt.value"
                @click="$emit('update:selectedDay', opt.value)"
                :class="['px-2.5 py-1 text-xs border tracking-wider transition-all whitespace-nowrap',
                         selectedDay === opt.value
                           ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium'
                           : 'border-white/10 text-[#888] hover:border-white/25']">
          {{ t[opt.labelKey] }}
        </button>
      </div>
      <div class="w-px h-4 bg-white/10 flex-shrink-0"></div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-[10px] text-[#555] tracking-widest uppercase whitespace-nowrap">{{ t.budget }}</span>
        <input type="range" min="0" :max="budgetMax" step="100"
               :value="maxBudget === Infinity ? budgetMax : maxBudget"
               @input="$emit('update:maxBudget', Number($event.target.value) >= budgetMax ? Infinity : Number($event.target.value))"
               class="w-28 accent-emerald-400 cursor-pointer" />
        <span class="text-xs text-[#f4f4f4] w-14 text-right tabular-nums">{{ budgetDisplay(maxBudget) }}</span>
      </div>
    </div>
```

注意：舊 Row 2 內的最愛按鈕（`ml-auto` 的那個）**不要複製**，已在 Task 1 移至 Row 1。

- [ ] **Step 2: 確認舊 Row 2 完整移除**

確認 `FilterBar.vue` 中已不存在：
- `flex-wrap gap-y-2` 的 Row 2 div
- `ml-auto` 的最愛按鈕

```bash
grep -n "flex-wrap gap-y-2\|ml-auto" src/components/FilterBar.vue
```

預期輸出：無任何結果（空）

- [ ] **Step 3: 視覺驗證**

確認 dev server 還在跑（若已停止執行 `npm run dev`），在 1280px+ 寬度確認：

1. Row 2：7 個地區 chips 靠左單行，不斷行
2. Row 3：IDENTITY chips → 分隔線 → DAY chips → 分隔線 → 預算 slider，乾淨一行
3. 切換各地區、身分、平假日、預算 → 互動正常
4. 縮小視窗至 < 1024px → Row 2 / Row 3 消失，手機版篩選不受影響
5. 最寬螢幕（拉到最大）→ 地區 chips 靠左，右邊自然留白，無空洞感

- [ ] **Step 4: Commit**

```bash
git add src/components/FilterBar.vue
git commit -m "feat(filterbar): split PC Row 2 into region row + filter row, remove flex-wrap"
```

---

### Task 3：最終整體驗收

**Files:** 無需修改

- [ ] **Step 1: 完整互動測試**

在 dev server（`npm run dev`）確認以下情境：

| 情境 | 預期結果 |
|------|----------|
| 點「我的最愛」（無收藏）| 按鈕變 emerald 底色，列表為空 |
| 點「我的最愛」（有收藏）| 按鈕變 emerald 底色，只顯示收藏球場 |
| 再點「我的最愛」| 回復低調外框，顯示所有球場 |
| 切換地區 chip | activeFilterCount 正確，手機版篩選列顯示數字 badge |
| 切換身分 / 平假日 | 表格 / 卡片數值更新 |
| 拖曳預算 slider | 即時更新顯示值與結果 |
| 縮小到 1024px 以下 | Row 1 的最愛按鈕消失，Row 2 / Row 3 消失，手機篩選 sheet 正常 |

- [ ] **Step 2: build 確認無 error**

```bash
npm run build
```

預期：build 成功，無 error（warning 可忽略）

- [ ] **Step 3: 最終 commit（若 build 有 auto-generated 檔案變動）**

```bash
git add -A
git commit -m "chore: post-build artifacts after filterbar PC layout refactor"
```

若 build 無變動則跳過此步驟。
