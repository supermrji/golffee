# FilterBar Two-Column Layout + UX Refinement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 PC 篩選列的 Row 2（地區）+ Row 3（身分/平假日/預算）合併為左右分欄布局，並優化整體互動樣式。

**Architecture:** 只改 `src/components/FilterBar.vue`。Row 1 小幅樣式提升；Row 2+3 整塊替換為左欄地區 chips（max-width 50%、flex-wrap）+ 漸層分隔線 + 右欄兩排（身分 / 平假日+預算）。手機版完全不動。

**Tech Stack:** Vue 3, Tailwind CSS v4, lucide-vue-next

---

### Task 1：Row 1 樣式細化

**Files:**
- Modify: `src/components/FilterBar.vue:77-109`

- [ ] **Step 1：搜尋框加淡底色 + 優化 transition**

找到（第 77 行）：
```html
      <div class="relative flex items-center flex-1 h-10 border border-white/10 hover:border-white/25 transition-colors px-3 gap-2">
```
改為：
```html
      <div class="relative flex items-center flex-1 h-10 border border-white/10 bg-white/[0.025] hover:border-white/[0.18] transition-all duration-150 px-3 gap-2">
```

- [ ] **Step 2：最愛按鈕加 hover 文字顏色 + font-medium**

找到（第 90-93 行）：
```html
              :class="['hidden lg:flex items-center gap-1.5 h-10 px-4 border text-xs tracking-wider transition-all flex-shrink-0',
                       showFavoritesOnly
                         ? 'bg-emerald-400 text-black font-bold border-emerald-400'
                         : 'border-white/10 text-[#888] hover:border-white/25']">
```
改為：
```html
              :class="['hidden lg:flex items-center gap-1.5 h-10 px-4 border text-xs tracking-wider transition-all duration-150 flex-shrink-0',
                       showFavoritesOnly
                         ? 'bg-emerald-400 text-black font-bold border-emerald-400'
                         : 'border-white/10 text-[#888] font-medium hover:border-white/25 hover:text-white/60']">
```

- [ ] **Step 3：View Toggle 加淡底色**

找到（第 98 行）：
```html
      <div class="hidden lg:flex items-center border border-white/10 h-10 flex-shrink-0">
```
改為：
```html
      <div class="hidden lg:flex items-center border border-white/10 h-10 bg-white/[0.02] flex-shrink-0">
```

- [ ] **Step 4：驗證 dev server 無 error**

```bash
cd /Users/kingsley0069/site/golffee/golffee && npm run dev &
sleep 4 && kill %1 2>/dev/null; wait 2>/dev/null
echo "done"
```
預期：無 Vite compilation error 輸出。

- [ ] **Step 5：Commit**

```bash
cd /Users/kingsley0069/site/golffee/golffee
git add src/components/FilterBar.vue
git commit -m "style(filterbar): refine Row 1 — search bg, fav hover, view toggle bg"
```

---

### Task 2：Row 2 + Row 3 → 左右分欄布局

**Files:**
- Modify: `src/components/FilterBar.vue:145-191`（整個 Row 2 + Row 3 區塊）

- [ ] **Step 1：替換 Row 2 + Row 3 為兩欄布局**

找到並完整替換以下區塊（第 145-191 行）：

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

替換為：

```html
    <!-- Row 2 (PC only): 左欄地區 / 右欄篩選 -->
    <div class="hidden lg:flex items-stretch mt-3">

      <!-- 左欄：地區 chips，max-width 50%，允許換行 -->
      <div class="flex flex-wrap items-start gap-[5px] max-w-[50%] flex-shrink-0">
        <button v-for="opt in regionOptions" :key="opt.value"
                @click="$emit('regionChange', opt.value)"
                :class="['px-2.5 py-[4px] text-xs border tracking-wider transition-all duration-150 whitespace-nowrap',
                         selectedRegion === opt.value
                           ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/[0.08] font-medium'
                           : 'border-white/[0.09] text-[#666] hover:border-white/20 hover:text-[#999]']">
          {{ opt.label }}<span class="text-[9px] opacity-35 ml-1">{{ opt.count }}</span>
        </button>
      </div>

      <!-- 漸層垂直分隔線 -->
      <div class="w-px flex-shrink-0 mx-[18px] self-stretch"
           style="background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.12) 80%, transparent)">
      </div>

      <!-- 右欄：身分（上排）/ 平假日 + 預算（下排） -->
      <div class="flex flex-col justify-center gap-2 flex-shrink-0">

        <!-- 身分 -->
        <div class="flex items-center gap-[6px]">
          <span class="text-[9px] text-[#3a3a3a] tracking-[0.18em] uppercase font-semibold whitespace-nowrap">{{ t.identity }}</span>
          <button v-for="opt in identityOptions" :key="opt.value"
                  @click="$emit('update:selectedIdentity', opt.value)"
                  :class="['px-2.5 py-[4px] text-xs border tracking-wider transition-all duration-150 whitespace-nowrap',
                           selectedIdentity === opt.value
                             ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/[0.08] font-medium'
                             : 'border-white/[0.09] text-[#666] hover:border-white/20 hover:text-[#999]']">
            {{ t[opt.labelKey] }}
          </button>
        </div>

        <!-- 平假日 + 預算 -->
        <div class="flex items-center gap-[6px]">
          <span class="text-[9px] text-[#3a3a3a] tracking-[0.18em] uppercase font-semibold whitespace-nowrap">{{ t.day }}</span>
          <button v-for="opt in dayOptions" :key="opt.value"
                  @click="$emit('update:selectedDay', opt.value)"
                  :class="['px-2.5 py-[4px] text-xs border tracking-wider transition-all duration-150 whitespace-nowrap',
                           selectedDay === opt.value
                             ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/[0.08] font-medium'
                             : 'border-white/[0.09] text-[#666] hover:border-white/20 hover:text-[#999]']">
            {{ t[opt.labelKey] }}
          </button>
          <div class="w-px h-3 bg-white/[0.07] flex-shrink-0 mx-1"></div>
          <span class="text-[9px] text-[#3a3a3a] tracking-[0.18em] uppercase font-semibold whitespace-nowrap">{{ t.budget }}</span>
          <input type="range" min="0" :max="budgetMax" step="100"
                 :value="maxBudget === Infinity ? budgetMax : maxBudget"
                 @input="$emit('update:maxBudget', Number($event.target.value) >= budgetMax ? Infinity : Number($event.target.value))"
                 class="w-28 accent-emerald-400 cursor-pointer" />
          <span class="text-xs text-[#c8c8c8] w-14 text-right tabular-nums font-medium">{{ budgetDisplay(maxBudget) }}</span>
        </div>

      </div>
    </div>
```

- [ ] **Step 2：驗證舊 Row 2 / Row 3 完整移除**

```bash
cd /Users/kingsley0069/site/golffee/golffee
grep -n "flex-wrap gap-y-2\|gap-x-4 mt-2\|Row 3" src/components/FilterBar.vue
```
預期：空輸出（無結果）

- [ ] **Step 3：dev server 驗證**

```bash
cd /Users/kingsley0069/site/golffee/golffee && npm run dev &
sleep 4 && kill %1 2>/dev/null; wait 2>/dev/null
echo "done"
```
預期：無 error。

- [ ] **Step 4：Commit**

```bash
cd /Users/kingsley0069/site/golffee/golffee
git add src/components/FilterBar.vue
git commit -m "feat(filterbar): two-column PC layout — regions left / identity+day+budget right"
```

---

### Task 3：Build 驗收 + Push

**Files:** 無需修改

- [ ] **Step 1：Build**

```bash
cd /Users/kingsley0069/site/golffee/golffee
npx vite-ssg build 2>&1 | tail -8
```
預期：`[vite-ssg] Build finished.` 無 error。

- [ ] **Step 2：Push to main**

```bash
cd /Users/kingsley0069/site/golffee/golffee
git push origin main
```
