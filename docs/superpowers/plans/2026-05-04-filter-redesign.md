# Filter 重設計 & 元件拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 Home.vue 從 1360 行拆分為 6 個聚焦元件，並重設計 filter bar（PC chips 兩行 + 手機下拉 sheet），加入看身分/看日期/預算上限篩選與表格/卡片視圖切換。

**Architecture:** Home.vue 保留狀態、路由、lifecycle 與 filteredCourses；五個子元件透過 props/emit 溝通，各目標 400 行以下。FilterBar 負責所有篩選 UI，CourseTable/CourseCards 負責資料顯示，兩個 Modal 元件獨立。

**Tech Stack:** Vue 3.5（Composition API + script setup + defineModel），Tailwind CSS v4，lucide-vue-next，vite-ssg。無測試框架，以 dev server 目視驗證。

---

### Task 1：更新 Home.vue 狀態與 computed

**Files:**
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：新增 i18n key 到 dict 四個語系**

在 `dict['zh-TW']` 物件內，在現有 key 之後加入：

```js
identity: '看身分',
identityGuest: '來賓',
identityMember: '會員',
identityMGuest: '同組',
identityTeam: '團體',
day: '看日期',
dayWeekday: '平日',
dayHoliday: '假日',
budget: '預算上限',
viewTable: '表格',
viewCard: '卡片',
filterBtn: '篩選',
resetFilter: '重置',
```

在 `dict['en']` 加入：

```js
identity: 'Identity',
identityGuest: 'Guest',
identityMember: 'Member',
identityMGuest: 'M-Guest',
identityTeam: 'Team',
day: 'Day',
dayWeekday: 'Weekday',
dayHoliday: 'Holiday',
budget: 'Budget',
viewTable: 'Table',
viewCard: 'Card',
filterBtn: 'Filter',
resetFilter: 'Reset',
```

在 `dict['ja']` 加入：

```js
identity: '区分',
identityGuest: 'ビジター',
identityMember: '会員',
identityMGuest: '同伴',
identityTeam: 'グループ',
day: '日程',
dayWeekday: '平日',
dayHoliday: '休日',
budget: '予算',
viewTable: 'テーブル',
viewCard: 'カード',
filterBtn: '絞込み',
resetFilter: 'リセット',
```

在 `dict['ko']` 加入：

```js
identity: '구분',
identityGuest: '비회원',
identityMember: '회원',
identityMGuest: '동반',
identityTeam: '단체',
day: '요일',
dayWeekday: '평일',
dayHoliday: '휴일',
budget: '예산',
viewTable: '테이블',
viewCard: '카드',
filterBtn: '필터',
resetFilter: '초기화',
```

- [ ] **Step 2：在 script setup 新增狀態變數**

找到 `const searchQuery = ref('')` 附近，加入以下新狀態：

```js
const selectedIdentity = ref('guest')  // 'guest' | 'member' | 'mGuest' | 'team'
const selectedDay = ref('weekday')     // 'weekday' | 'holiday'
const maxBudget = ref(Infinity)
const viewMode = ref(localStorage.getItem('golffee_view') || 'table')
const showMobileFilter = ref(false)

watch(viewMode, (v) => localStorage.setItem('golffee_view', v))
```

同時，將現有的 `const showFilterPanel = ref(false)` **刪除**（已由 showMobileFilter 取代）。
將現有的 `const sortBy = ref('default')` **刪除**（由 priceField computed 取代）。

- [ ] **Step 3：新增 priceField computed**

在 `const filteredCourses = computed(...)` 之前加入：

```js
const priceField = computed(() => {
  if (selectedIdentity.value === 'member') return 'member'
  const dayKey = selectedDay.value === 'weekday' ? 'Weekday' : 'Holiday'
  const map = { guest: 'guest', mGuest: 'memberGuest', team: 'team' }
  return map[selectedIdentity.value] + dayKey
})
```

- [ ] **Step 4：新增 budgetMax computed**

```js
const budgetMax = computed(() => {
  const prices = golfDataJson
    .map(c => parseInt(c[priceField.value]))
    .filter(n => !isNaN(n))
  return prices.length ? Math.max(...prices) : 20000
})
```

- [ ] **Step 5：新增 regionOptions computed（地區選項含本地化名稱與數量）**

```js
const regionOptions = computed(() =>
  regions.value.map(r => ({
    value: r,
    label: getRegionName(r),
    count: regionCounts[r] ?? 0,
  }))
)
```

- [ ] **Step 6：更新 filteredCourses computed**

將現有的 `filteredCourses` 完整替換為：

```js
const filteredCourses = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  const budget = maxBudget.value
  const field = priceField.value

  const list = regionCourses.value.filter(c => {
    if (search && !c.name.toLowerCase().includes(search) && !getCourseName(c).toLowerCase().includes(search)) return false
    if (showFavoritesOnly.value && !isFavorite(c.name)) return false
    if (selectedGolfDay.value !== ALL_GOLF_DAY && c.golfDay !== selectedGolfDay.value) return false
    const price = parseInt(c[field])
    if (!isNaN(price) && price > budget) return false
    return true
  })

  return [...list]
    .sort((a, b) => parseNum(a[field]) - parseNum(b[field]))
    .map(c => ({ ...c, parsedRemarks: parseRemarks(c.remarks) }))
})
```

- [ ] **Step 7：更新 activeFilterCount computed**

將現有 `activeFilterCount` 替換為：

```js
const activeFilterCount = computed(() => {
  let count = 0
  if (selectedIdentity.value !== 'guest') count++
  if (selectedDay.value !== 'weekday') count++
  if (maxBudget.value !== Infinity) count++
  if (selectedGolfDay.value !== ALL_GOLF_DAY) count++
  if (showFavoritesOnly.value) count++
  return count
})
```

- [ ] **Step 8：更新 onRegionChange 接受 newRegion 參數**

將現有 `onRegionChange` 替換為：

```js
const onRegionChange = async (newRegion) => {
  selectedRegion.value = newRegion
  const slug = REGION_TO_SLUG[newRegion]
  if (slug) await router.push(`/region/${slug}`)
  else await router.push('/')
  await nextTick()
  const el = document.getElementById('content-layer')
  if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}
```

- [ ] **Step 9：確認 dev server 無 console 錯誤**

```bash
cd /Users/kingsley0069/site/golffee/golffee && npm run dev
```

開 `http://localhost:5173`，console 無 error 即可（此時 UI 仍用舊模板，功能尚未接上）。

- [ ] **Step 10：Commit**

```bash
git add src/pages/Home.vue
git commit -m "feat: add identity/day/budget/viewMode state and priceField computed"
```

---

### Task 2：建立 AboutModal.vue

**Files:**
- Create: `src/components/AboutModal.vue`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：建立 `src/components/AboutModal.vue`**

```vue
<script setup>
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { features, changelog } from '../data/about.js'

defineProps({
  show: Boolean,
  t: Object,
  isDesktop: Boolean,
  isStandalone: Boolean,
})
defineEmits(['close'])

const aboutTab = ref('features')
</script>

<template>
  <Transition name="guide">
    <div v-if="show"
         class="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-black/70 backdrop-blur-sm"
         @click.self="$emit('close')">
      <div class="guide-panel w-full max-w-md lg:max-w-lg bg-[#0d0d0d] border-t lg:border border-white/10 rounded-t-2xl lg:rounded-2xl pb-10 overflow-y-auto"
           :style="isDesktop ? { maxHeight: '80vh' } : { height: isStandalone ? 'calc(92vh - env(safe-area-inset-top))' : '95vh' }">
        <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <h2 class="text-white text-base font-medium tracking-wide">{{ t.aboutTitle }}</h2>
          <button @click="$emit('close')" class="text-white/40 hover:text-white transition-colors p-1" aria-label="關閉">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="flex border-b border-white/10">
          <button @click="aboutTab = 'features'"
                  :class="['flex-1 py-3 text-sm tracking-wide transition-colors', aboutTab === 'features' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/70']">
            {{ t.featuresTab }}
          </button>
          <button @click="aboutTab = 'changelog'"
                  :class="['flex-1 py-3 text-sm tracking-wide transition-colors', aboutTab === 'changelog' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/70']">
            {{ t.changelogTab }}
          </button>
        </div>
        <div v-if="aboutTab === 'features'" class="px-6 pt-5 pb-4 flex flex-col gap-6">
          <div v-for="section in features" :key="section.label">
            <p class="text-xs tracking-[0.2em] text-white/30 uppercase mb-3">{{ section.label }}</p>
            <ul class="flex flex-col gap-2">
              <li v-for="f in section.items" :key="f" class="flex items-center gap-2.5 text-sm text-white/70">
                <span class="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0"></span>
                <span v-html="f"></span>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="aboutTab === 'changelog'" class="px-6 pt-5 pb-4 flex flex-col gap-6">
          <div v-for="release in changelog" :key="release.version">
            <p class="text-emerald-400 text-xs font-medium tracking-widest mb-2">{{ release.version }}</p>
            <ul class="flex flex-col gap-1.5">
              <li v-for="item in release.items" :key="item" class="flex items-start gap-2.5 text-sm text-white/60">
                <span class="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2"></span>
                <span v-html="item"></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.guide-enter-active, .guide-leave-active { transition: opacity 0.25s ease; }
.guide-enter-active .guide-panel, .guide-leave-active .guide-panel { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.guide-enter-from, .guide-leave-to { opacity: 0; }
.guide-enter-from .guide-panel, .guide-leave-to .guide-panel { transform: translateY(100%); }
@media (min-width: 1024px) {
  .guide-enter-from .guide-panel, .guide-leave-to .guide-panel { transform: translateY(12px) scale(0.97); opacity: 0; }
}
</style>
```

- [ ] **Step 2：在 Home.vue 引入並替換 About Modal**

script 頂部加入：
```js
import AboutModal from '../components/AboutModal.vue'
```

找到 template 中 `<!-- About Modal -->` 整段（`<Transition name="guide"><div v-if="showAbout"...` 到對應的 `</Transition>`），替換為：

```html
<AboutModal
  :show="showAbout"
  :t="t"
  :isDesktop="isDesktop"
  :isStandalone="isStandalone"
  @close="showAbout = false"
/>
```

刪除 Home.vue script 中的 `const aboutTab = ref('features')`（已移入 AboutModal）。

- [ ] **Step 3：確認 About modal 正常**

瀏覽器點「關於」→ modal 開啟、tabs 可切換、點外部或 X 關閉、body scroll lock 正常。

- [ ] **Step 4：Commit**

```bash
git add src/components/AboutModal.vue src/pages/Home.vue
git commit -m "refactor: extract AboutModal component"
```

---

### Task 3：建立 InstallGuideModal.vue

**Files:**
- Create: `src/components/InstallGuideModal.vue`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：建立 `src/components/InstallGuideModal.vue`**

```vue
<script setup>
import { X } from 'lucide-vue-next'

defineProps({ show: Boolean, isStandalone: Boolean })
defineEmits(['close'])
</script>

<template>
  <Transition name="guide">
    <div v-if="show"
         class="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm"
         @click.self="$emit('close')">
      <div class="guide-panel w-full max-w-md bg-[#0d0d0d] border-t border-white/10 rounded-t-2xl pb-10 overflow-y-auto"
           :style="{ maxHeight: isStandalone ? 'calc(92vh - env(safe-area-inset-top))' : '88vh' }">
        <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 class="text-white text-base font-medium tracking-wide">加入主畫面</h2>
            <p class="text-white/40 text-sm mt-0.5 tracking-wide">將此網頁安裝為 App</p>
          </div>
          <button @click="$emit('close')" class="text-white/40 hover:text-white transition-colors p-1" aria-label="關閉">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="px-6 pt-5 flex flex-col gap-8">
          <div v-for="(step, i) in steps" :key="i" class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-sm font-medium">{{ i + 1 }}</div>
            <div class="flex-1">
              <p class="text-white text-base font-medium mb-1">{{ step.title }}</p>
              <p class="text-white/50 text-sm leading-relaxed mb-3">{{ step.desc }}</p>
              <img :src="step.img" class="w-full rounded-xl border border-white/10" :alt="step.alt" />
            </div>
          </div>
          <div class="flex items-center gap-3 bg-emerald-400/5 border border-emerald-400/20 rounded-xl px-4 py-3 mb-2">
            <span class="text-xl">✅</span>
            <p class="text-white/70 text-sm leading-relaxed">完成後桌面會出現 App 圖示，下次直接點開就是全螢幕體驗！</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
// steps data defined outside setup for clarity
const steps = [
  { title: '使用 Safari 開啟網頁', desc: '確認你使用的是 iPhone 內建的 Safari 瀏覽器，點選底部中間的 ⬆ 分享按鈕', img: '/guide-step1.jpg', alt: 'Safari 分享按鈕示意' },
  { title: '選擇「加入主畫面」', desc: '在分享選單中找到「加入主畫面」並點選', img: '/guide-step2.jpg', alt: '加入主畫面選項示意' },
  { title: '點選右上角「加入」', desc: '確認名稱後點選加入，完成安裝', img: '/guide-step3.jpg', alt: '確認加入主畫面示意' },
]
</script>

<style scoped>
.guide-enter-active, .guide-leave-active { transition: opacity 0.25s ease; }
.guide-enter-active .guide-panel, .guide-leave-active .guide-panel { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.guide-enter-from, .guide-leave-to { opacity: 0; }
.guide-enter-from .guide-panel, .guide-leave-to .guide-panel { transform: translateY(100%); }
</style>
```

**注意：** 上面用了 `<script>` + `<script setup>` 雙 script 的方式定義 `steps` 常數，避免放在 setup 裡每次渲染都重建。或者更簡單：直接把 steps 定義在 `<script setup>` 的頂層（非 reactive，無所謂）：

```js
// 在 <script setup> 中直接定義
const steps = [
  { title: '使用 Safari 開啟網頁', desc: '確認你使用的是 iPhone 內建的 Safari 瀏覽器，點選底部中間的 ⬆ 分享按鈕', img: '/guide-step1.jpg', alt: 'Safari 分享按鈕示意' },
  { title: '選擇「加入主畫面」', desc: '在分享選單中找到「加入主畫面」並點選', img: '/guide-step2.jpg', alt: '加入主畫面選項示意' },
  { title: '點選右上角「加入」', desc: '確認名稱後點選加入，完成安裝', img: '/guide-step3.jpg', alt: '確認加入主畫面示意' },
]
```

選用後者即可，刪掉多餘的 `<script>` block。

- [ ] **Step 2：在 Home.vue 引入並替換 Install Guide Modal**

```js
import InstallGuideModal from '../components/InstallGuideModal.vue'
```

找到 `<!-- Install Guide Modal -->` 整段，替換為：

```html
<InstallGuideModal
  :show="showInstallGuide"
  :isStandalone="isStandalone"
  @close="showInstallGuide = false"
/>
```

- [ ] **Step 3：確認手機版「加入主畫面」modal 正常**

手機尺寸點「加入主畫面」按鈕，modal 開啟/關閉，三個步驟圖片正常顯示。

- [ ] **Step 4：Commit**

```bash
git add src/components/InstallGuideModal.vue src/pages/Home.vue
git commit -m "refactor: extract InstallGuideModal component"
```

---

### Task 4：建立 CourseTable.vue

**Files:**
- Create: `src/components/CourseTable.vue`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：建立 `src/components/CourseTable.vue`**

```vue
<script setup>
import { reactive } from 'vue'
import { Utensils, Droplets, CreditCard, Heart, ExternalLink, Phone } from 'lucide-vue-next'
import GolfFlag from '../GolfFlag.vue'

const props = defineProps({
  courses: Array,
  priceField: String,
  favorites: Array,
  todayWeekday: String,
  t: Object,
  locale: String,
})
defineEmits(['toggleFavorite'])

const expandedRemarks = reactive(new Set())

const formatPrice = (p) => (!p || p === '-') ? props.t.noData : p

const highlightMoney = (text) => {
  if (!text) return ''
  return text.replace(
    /(^|[^0-9/:\-~])(\d{3,})(?=[^0-9/:\-~人位組桌球年月日]|$)/g,
    '$1<span class="text-amber-400 font-medium tracking-wide mx-[1px]">$2</span>'
  )
}

const getMapUrl = (name) => {
  const suffix = { 'zh-TW': ' 高爾夫', en: ' golf', ja: ' ゴルフ', ko: ' 골프' }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + (suffix[props.locale] ?? ' 高爾夫'))}`
}

const getCourseName = (c) => {
  if (props.locale === 'en') return c.name_en || c.name
  if (props.locale === 'ja') return c.name_ja || c.name
  if (props.locale === 'ko') return c.name_ko || c.name
  return c.name
}

const isFavorite = (name) => props.favorites.includes(name)

// 判斷某個欄位組是否為當前選取（用於 th 高亮）
const isColActive = (...fields) => fields.includes(props.priceField)
// 判斷單一 td 是否為選取欄
const isCellActive = (field) => field === props.priceField
</script>

<template>
  <table class="w-full text-left whitespace-nowrap">
    <thead>
      <tr class="text-base uppercase tracking-widest font-semibold bg-[#111111] shadow-lg pointer-events-none sticky top-[130px] z-30">
        <th class="py-5 font-semibold w-[16%] px-4 rounded-tl-sm text-[#f4f4f4]">{{ t.course }}</th>
        <th :class="['py-5 font-semibold px-4', isColActive('guestWeekday','guestHoliday') ? 'text-emerald-400' : 'text-[#f4f4f4]']">
          {{ t.guest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span>
        </th>
        <th :class="['py-5 font-semibold px-4', isColActive('member') ? 'text-emerald-400' : 'text-[#f4f4f4]']">{{ t.member }}</th>
        <th :class="['py-5 font-semibold px-4', isColActive('memberGuestWeekday','memberGuestHoliday') ? 'text-emerald-400' : 'text-[#f4f4f4]']">
          {{ t.mGuest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span>
        </th>
        <th :class="['py-5 font-semibold px-4', isColActive('teamWeekday','teamHoliday') ? 'text-emerald-400' : 'text-[#f4f4f4]']">
          {{ t.team }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span>
        </th>
        <th class="py-5 font-semibold text-right px-4 text-[#f4f4f4]">{{ t.amenities }}</th>
        <th class="py-5 font-semibold w-[33%] px-4 rounded-tr-sm text-[#f4f4f4]">{{ t.remarks }}</th>
      </tr>
    </thead>
    <tbody class="text-base font-light">
      <tr v-if="courses.length === 0">
        <td colspan="7" class="py-24 text-center">
          <p class="text-white/40 text-base">{{ t.noResult }}</p>
          <p class="text-white/20 text-sm mt-2">{{ t.noResultSub }}</p>
        </td>
      </tr>
      <tr v-for="c in courses" :key="c.name"
          :class="['border-b border-white/[0.08] transition-colors group',
                   c.status === 'closed' ? 'opacity-60 even:bg-[#1a1a1a] odd:bg-[#111111]' : 'even:bg-[#1a1a1a] odd:bg-[#111111] hover:bg-[#262626]']">

        <!-- Course info -->
        <td class="py-5 px-4 align-top">
          <div class="flex justify-between items-start pr-2">
            <div>
              <div class="flex items-center gap-2 min-w-0">
                <button @click="$emit('toggleFavorite', c.name)" class="focus:outline-none group/fav flex-shrink-0 p-1 -m-1" :aria-label="isFavorite(c.name) ? '取消最愛' : '加入最愛'">
                  <Heart :class="['w-4 h-4 transition-all duration-300', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10 group-hover/fav:text-white/40']" />
                </button>
                <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                   class="group-hover:text-emerald-300 text-emerald-400 transition-colors relative text-lg tracking-wide font-medium truncate min-w-0">
                  {{ getCourseName(c) }}
                  <span class="absolute -bottom-1 left-0 w-full h-[1px] bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </a>
                <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                   class="text-[#444] hover:text-emerald-400 transition-colors flex-shrink-0" :aria-label="`${c.name} 官網`">
                  <ExternalLink class="w-3.5 h-3.5" />
                </a>
                <span v-if="c.golfDay"
                      :class="['inline-flex items-center gap-1 flex-shrink-0 text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap',
                               c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#666] border-white/10']">
                  <GolfFlag :size="12" />{{ c.golfDay }}
                </span>
              </div>
              <div class="mt-2 flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <div class="text-[#ccc] text-sm tracking-wider uppercase font-normal">{{ c.region }}</div>
                  <span v-if="c.holes" class="text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                </div>
                <div v-if="c.phone" class="text-[#f4f4f4] text-sm flex items-center gap-1.5">
                  <Phone class="w-2.5 h-2.5" /><span>{{ c.phone }}</span>
                </div>
              </div>
            </div>
            <div class="text-right ml-4 flex flex-col items-end gap-2">
              <span v-if="c.status === 'closed'" class="text-xs px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">{{ t.closed }}</span>
              <div v-if="c.updateDate" class="text-xs text-[#f4f4f4] tracking-[0.1em] uppercase font-light">
                {{ t.update }}<br/><span class="text-[#eee]">{{ c.updateDate }}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- Guest -->
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('guestWeekday') ? 'text-emerald-300 font-medium' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestWeekday) }}</span>
          <span class="text-[#555] px-1 font-mono">/</span>
          <span :class="isCellActive('guestHoliday') ? 'text-emerald-300 font-medium' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestHoliday) }}</span>
        </td>

        <!-- Member -->
        <td :class="['py-5 px-4 align-top font-mono text-base', isCellActive('member') ? 'text-emerald-300 font-medium' : 'text-[#fff]']">
          {{ formatPrice(c.member) }}
        </td>

        <!-- M-Guest -->
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('memberGuestWeekday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.memberGuestWeekday) }}</span>
          <span class="text-[#666] px-1 font-mono">/</span>
          <span :class="isCellActive('memberGuestHoliday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.memberGuestHoliday) }}</span>
        </td>

        <!-- Team -->
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('teamWeekday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.teamWeekday) }}</span>
          <span class="text-[#666] px-1 font-mono">/</span>
          <span :class="isCellActive('teamHoliday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.teamHoliday) }}</span>
        </td>

        <!-- Amenities -->
        <td class="py-5 px-4 align-top">
          <div class="flex justify-end gap-3">
            <span v-if="c.hasRestaurant" class="relative group/tip flex items-center">
              <Utensils class="w-4 h-4 text-[#f4f4f4]" :aria-label="t.amenityRestaurant" role="img" />
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-xs bg-[#1a1a1a] border border-white/15 text-white/80 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">{{ t.amenityRestaurant }}</span>
            </span>
            <span v-if="c.hasWater" class="relative group/tip flex items-center">
              <Droplets class="w-4 h-4 text-[#f4f4f4]" :aria-label="t.amenityWater" role="img" />
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-xs bg-[#1a1a1a] border border-white/15 text-white/80 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">{{ t.amenityWater }}</span>
            </span>
            <span v-if="c.hasCard" class="relative group/tip flex items-center">
              <CreditCard class="w-4 h-4 text-[#f4f4f4]" :aria-label="t.amenityCard" role="img" />
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-xs bg-[#1a1a1a] border border-white/15 text-white/80 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity">{{ t.amenityCard }}</span>
            </span>
          </div>
        </td>

        <!-- Remarks -->
        <td class="py-5 px-4 align-top text-[#f4f4f4] whitespace-normal leading-relaxed text-sm">
          <template v-if="c.parsedRemarks.length">
            <div :class="expandedRemarks.has(c.name) ? '' : 'line-clamp-[5]'">
              <ul class="list-disc pl-3 space-y-1.5 marker:text-[#444]">
                <li v-for="(rm, idx) in c.parsedRemarks" :key="idx" v-html="highlightMoney(rm)"></li>
              </ul>
            </div>
            <button v-if="c.parsedRemarks.length > 2"
                    @click="expandedRemarks.has(c.name) ? expandedRemarks.delete(c.name) : expandedRemarks.add(c.name)"
                    class="mt-3 px-3 py-1.5 text-xs border border-white/20 bg-white/5 text-[#aaa] hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all tracking-wide rounded">
              {{ expandedRemarks.has(c.name) ? t.collapse : t.expand }}
            </button>
          </template>
          <span v-else>{{ t.noData }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

- [ ] **Step 2：在 Home.vue 引入並替換 Desktop Table 區塊**

```js
import CourseTable from '../components/CourseTable.vue'
```

找到 `<!-- Desktop Table Architecture -->` 整段（`<div id="golffee-table" class="hidden xl:block pt-6">` 到 `</div>`），替換為：

```html
<div id="golffee-table" :class="['pt-6', viewMode === 'table' ? 'block' : 'hidden']">
  <CourseTable
    :courses="filteredCourses"
    :priceField="priceField"
    :favorites="favorites"
    :todayWeekday="todayWeekday"
    :t="t"
    :locale="locale"
    @toggleFavorite="toggleFavorite"
  />
</div>
```

- [ ] **Step 3：確認表格視圖正常**

瀏覽器確認：表格顯示所有球場、來賓欄預設高亮（emerald）、收藏 heart 正常、備註展開/收起、Google Maps 連結正常。

- [ ] **Step 4：Commit**

```bash
git add src/components/CourseTable.vue src/pages/Home.vue
git commit -m "refactor: extract CourseTable component with priceField highlighting"
```

---

### Task 5：建立 CourseCards.vue

**Files:**
- Create: `src/components/CourseCards.vue`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：建立 `src/components/CourseCards.vue`**

```vue
<script setup>
import { reactive } from 'vue'
import { Utensils, Droplets, CreditCard, Heart, ExternalLink, Phone } from 'lucide-vue-next'
import GolfFlag from '../GolfFlag.vue'

const props = defineProps({
  courses: Array,
  priceField: String,
  favorites: Array,
  todayWeekday: String,
  t: Object,
  locale: String,
})
defineEmits(['toggleFavorite'])

const expandedRemarks = reactive(new Set())
const clampedRemarks = reactive(new Set())

function checkOverflow(el, name) {
  if (!el) return
  el.scrollHeight > el.clientHeight + 2
    ? clampedRemarks.add(name)
    : clampedRemarks.delete(name)
}

const formatPrice = (p) => (!p || p === '-') ? props.t.noData : p

const highlightMoney = (text) => {
  if (!text) return ''
  return text.replace(
    /(^|[^0-9/:\-~])(\d{3,})(?=[^0-9/:\-~人位組桌球年月日]|$)/g,
    '$1<span class="text-amber-400 font-medium tracking-wide mx-[1px]">$2</span>'
  )
}

const getMapUrl = (name) => {
  const suffix = { 'zh-TW': ' 高爾夫', en: ' golf', ja: ' ゴルフ', ko: ' 골프' }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + (suffix[props.locale] ?? ' 高爾夫'))}`
}

const getCourseName = (c) => {
  if (props.locale === 'en') return c.name_en || c.name
  if (props.locale === 'ja') return c.name_ja || c.name
  if (props.locale === 'ko') return c.name_ko || c.name
  return c.name
}

const isFavorite = (name) => props.favorites.includes(name)
const isActive = (field) => field === props.priceField
const isGroupActive = (...fields) => fields.includes(props.priceField)
</script>

<template>
  <div>
    <div v-if="courses.length === 0" class="py-24 text-center">
      <p class="text-white/40 text-base">{{ t.noResult }}</p>
      <p class="text-white/20 text-sm mt-2">{{ t.noResultSub }}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
      <div v-for="c in courses" :key="c.name"
           :class="['flex flex-col p-4 md:p-6 border rounded-xl group transition-colors',
                    c.status === 'closed' ? 'bg-[#0a0a0a] opacity-60 border-white/[0.12]' : 'bg-[#0a0a0a] border-white/[0.12] hover:border-white/25']">

        <!-- Header -->
        <div class="mb-6 pb-4 border-b border-white/[0.12] flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <button @click="$emit('toggleFavorite', c.name)" class="focus:outline-none flex-shrink-0 p-1 -m-1">
                <Heart :class="['w-6 h-6 transition-all', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10']" />
              </button>
              <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                 :class="locale === 'zh-TW' ? 'text-2xl font-normal tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors' : 'text-xl font-medium text-emerald-400 hover:text-emerald-300 transition-colors'">
                {{ getCourseName(c) }}
              </a>
              <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 text-[#444] hover:text-emerald-400 transition-colors">
                <ExternalLink class="w-4 h-4" />
              </a>
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-xs text-[#ccc] uppercase tracking-wider">{{ c.region }}</p>
                <span v-if="c.holes" class="text-[10px] md:text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider whitespace-nowrap">{{ c.holes }}H</span>
                <span v-if="c.golfDay"
                      :class="['inline-flex items-center gap-1 text-[10px] md:text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap',
                               c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#888] border-white/10']">
                  <GolfFlag :size="12" />{{ c.golfDay }}
                </span>
              </div>
              <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-2">
                <Phone class="w-3 h-3" />{{ c.phone }}
              </p>
            </div>
          </div>
          <div class="text-right mt-1.5 flex flex-col items-end gap-2 flex-shrink-0 ml-3">
            <span v-if="c.status === 'closed'" class="text-[10px] md:text-xs px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">{{ t.closed }}</span>
            <div v-if="c.updateDate && c.status !== 'closed'" class="text-[10px] md:text-xs text-[#FFF] tracking-[0.1em] uppercase flex flex-col items-end font-light">
              <span>{{ t.update }}</span><span class="text-[#eee]">{{ c.updateDate }}</span>
            </div>
          </div>
        </div>

        <!-- Prices -->
        <div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
          <!-- Guest -->
          <div :class="isGroupActive('guestWeekday','guestHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('guestWeekday','guestHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.guest }}</p>
            <p class="text-sm font-mono font-medium">
              <span :class="isActive('guestWeekday') ? 'text-emerald-300' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestWeekday) }}</span>
              <span class="text-[#555] text-xs px-1">/</span>
              <span :class="isActive('guestHoliday') ? 'text-emerald-300' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestHoliday) }}</span>
            </p>
          </div>
          <!-- Member -->
          <div :class="isActive('member') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isActive('member') ? 'text-emerald-400' : 'text-[#888]']">{{ t.member }}</p>
            <p :class="['text-base tracking-wide font-mono', isActive('member') ? 'text-emerald-300' : 'text-white']">{{ formatPrice(c.member) }}</p>
          </div>
          <!-- M-Guest -->
          <div :class="isGroupActive('memberGuestWeekday','memberGuestHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('memberGuestWeekday','memberGuestHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.mGuest }}</p>
            <p class="text-sm font-mono">
              <span :class="isActive('memberGuestWeekday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.memberGuestWeekday) }}</span>
              <span class="text-[#666] text-xs px-1">/</span>
              <span :class="isActive('memberGuestHoliday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.memberGuestHoliday) }}</span>
            </p>
          </div>
          <!-- Team -->
          <div :class="isGroupActive('teamWeekday','teamHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('teamWeekday','teamHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.team }}</p>
            <p class="text-sm font-mono">
              <span :class="isActive('teamWeekday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.teamWeekday) }}</span>
              <span class="text-[#666] text-xs px-1">/</span>
              <span :class="isActive('teamHoliday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.teamHoliday) }}</span>
            </p>
          </div>
          <!-- Amenities -->
          <div class="col-span-2">
            <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.amenities }}</p>
            <div class="flex gap-3 mt-1 flex-wrap">
              <span v-if="c.hasRestaurant" class="flex items-center gap-1 text-[#aaa]">
                <Utensils class="w-3.5 h-3.5" /><span class="text-xs tracking-wide">{{ t.amenityRestaurant }}</span>
              </span>
              <span v-if="c.hasWater" class="flex items-center gap-1 text-[#aaa]">
                <Droplets class="w-3.5 h-3.5" /><span class="text-xs tracking-wide">{{ t.amenityWater }}</span>
              </span>
              <span v-if="c.hasCard" class="flex items-center gap-1 text-[#aaa]">
                <CreditCard class="w-3.5 h-3.5" /><span class="text-xs tracking-wide">{{ t.amenityCard }}</span>
              </span>
              <span v-if="!c.hasRestaurant && !c.hasWater && !c.hasCard" class="text-xs text-[#444] tracking-wide">{{ t.noData }}</span>
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div v-if="c.parsedRemarks.length" class="pt-4 border-t border-white/[0.12]">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-[#888] uppercase tracking-wider">{{ t.remarks }}</p>
            <button v-if="clampedRemarks.has(c.name) || expandedRemarks.has(c.name)"
                    @click="expandedRemarks.has(c.name) ? expandedRemarks.delete(c.name) : expandedRemarks.add(c.name)"
                    class="px-3 py-1.5 text-xs border border-white/20 bg-white/5 text-[#aaa] hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all tracking-wide rounded">
              {{ expandedRemarks.has(c.name) ? t.collapse : t.expand }}
            </button>
          </div>
          <div :class="expandedRemarks.has(c.name) ? '' : 'line-clamp-[5]'"
               :ref="el => checkOverflow(el, c.name)">
            <ul class="list-disc pl-3 space-y-2 text-sm text-[#f4f4f4] leading-relaxed marker:text-[#444]">
              <li v-for="(rm, idx) in c.parsedRemarks" :key="idx" v-html="highlightMoney(rm)"></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2：在 Home.vue 引入並替換 Mobile Cards 區塊**

```js
import CourseCards from '../components/CourseCards.vue'
```

找到 `<!-- Mobile Architecture (Hidden on large screens) -->` 整段（`<div id="golffee-cards" class="xl:hidden">` 到 `</div></div>`），替換為：

```html
<div id="golffee-cards" :class="viewMode === 'card' ? 'block' : 'hidden'">
  <CourseCards
    :courses="filteredCourses"
    :priceField="priceField"
    :favorites="favorites"
    :todayWeekday="todayWeekday"
    :t="t"
    :locale="locale"
    @toggleFavorite="toggleFavorite"
  />
</div>
```

刪除 Home.vue script 中的 `expandedRemarks`、`clampedRemarks`、`checkOverflow`（已移入 CourseCards）。

- [ ] **Step 3：確認卡片視圖正常**

切換至卡片視圖，確認：卡片顯示、identity 欄位高亮（ring + emerald 色）、收藏、備註展開、lg 斷點三欄。

- [ ] **Step 4：Commit**

```bash
git add src/components/CourseCards.vue src/pages/Home.vue
git commit -m "refactor: extract CourseCards component with identity highlighting"
```

---

### Task 6：建立 FilterBar.vue

**Files:**
- Create: `src/components/FilterBar.vue`
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：建立 `src/components/FilterBar.vue`**

```vue
<script setup>
import { Search, ChevronDown, Heart, Globe, LayoutList, LayoutGrid, X, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps({
  regionOptions: Array,      // [{ value, label, count }]
  selectedRegion: String,
  searchQuery: String,
  selectedIdentity: String,
  selectedDay: String,
  maxBudget: Number,
  budgetMax: Number,
  viewMode: String,
  showFavoritesOnly: Boolean,
  selectedGolfDay: String,
  weekdays: Array,
  todayWeekday: String,
  t: Object,
  locale: String,
  filterVisible: Boolean,
  activeFilterCount: Number,
  topControlsVisible: Boolean,
  fontSize: String,
  hintSeen: Boolean,
  ALL_GOLF_DAY: String,
})

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedIdentity',
  'update:selectedDay',
  'update:maxBudget',
  'update:viewMode',
  'update:showFavoritesOnly',
  'update:selectedGolfDay',
  'update:locale',
  'regionChange',
  'toggleFontSize',
  'markHintSeen',
])

const showMobileFilter = defineModel('showMobileFilter', { default: false })

const identityOptions = [
  { value: 'guest',  labelKey: 'identityGuest' },
  { value: 'member', labelKey: 'identityMember' },
  { value: 'mGuest', labelKey: 'identityMGuest' },
  { value: 'team',   labelKey: 'identityTeam' },
]

const dayOptions = [
  { value: 'weekday', labelKey: 'dayWeekday' },
  { value: 'holiday', labelKey: 'dayHoliday' },
]

const budgetDisplay = (val) =>
  val === Infinity || val >= props.budgetMax
    ? '不限'
    : `$${Number(val).toLocaleString()}`

const resetFilters = () => {
  emit('update:selectedIdentity', 'guest')
  emit('update:selectedDay', 'weekday')
  emit('update:maxBudget', Infinity)
  emit('update:showFavoritesOnly', false)
  emit('update:selectedGolfDay', props.ALL_GOLF_DAY)
}
</script>

<template>
  <div id="filter-bar"
       :class="['sticky z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-6 -mx-6 lg:px-12 lg:-mx-12 pt-4 pb-3 lg:pt-5 lg:pb-4 shadow-sm transition-transform duration-300',
                !filterVisible ? '-translate-y-full lg:translate-y-0' : '']"
       style="top: env(safe-area-inset-top)">

    <!-- Row 1: Search + View Toggle + (mobile) Filter button -->
    <div class="flex items-center gap-2">

      <!-- Search -->
      <div class="relative flex items-center flex-1 h-10 border border-white/10 hover:border-white/25 transition-colors px-3 gap-2">
        <Search class="w-4 h-4 text-[#888] flex-shrink-0" />
        <input type="text"
               :value="searchQuery"
               @input="$emit('update:searchQuery', $event.target.value)"
               placeholder="搜尋球場名稱或地區，例如：林口、海景、Nicklaus"
               class="flex-1 bg-transparent text-sm text-[#f4f4f4] placeholder:text-[#555] focus:outline-none min-w-0" />
        <button v-if="searchQuery" @click="$emit('update:searchQuery', '')" class="text-[#555] hover:text-white/60 flex-shrink-0">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- PC: View Toggle -->
      <div class="hidden lg:flex items-center border border-white/10 h-10 flex-shrink-0">
        <button @click="$emit('update:viewMode', 'table')"
                :class="['flex items-center gap-1.5 px-3 h-full text-xs tracking-widest border-r border-white/10 transition-all',
                         viewMode === 'table' ? 'text-white bg-white/5' : 'text-[#888] hover:text-white/60']">
          <LayoutList class="w-4 h-4" />{{ t.viewTable }}
        </button>
        <button @click="$emit('update:viewMode', 'card')"
                :class="['flex items-center gap-1.5 px-3 h-full text-xs tracking-widest transition-all',
                         viewMode === 'card' ? 'text-white bg-white/5' : 'text-[#888] hover:text-white/60']">
          <LayoutGrid class="w-4 h-4" />{{ t.viewCard }}
        </button>
      </div>

      <!-- Mobile: View toggle icon -->
      <button @click="$emit('update:viewMode', viewMode === 'table' ? 'card' : 'table')"
              class="lg:hidden flex items-center justify-center w-10 h-10 flex-shrink-0 border border-white/10 text-[#888] hover:text-white/60 transition-colors">
        <LayoutGrid v-if="viewMode === 'table'" class="w-4 h-4" />
        <LayoutList v-else class="w-4 h-4" />
      </button>

      <!-- Mobile: Filter button -->
      <button @click="showMobileFilter = !showMobileFilter"
              :class="['lg:hidden relative flex items-center gap-1.5 px-3 h-10 flex-shrink-0 border text-xs tracking-widest uppercase transition-all',
                       showMobileFilter || activeFilterCount > 0 ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/10 text-[#888]']">
        <SlidersHorizontal class="w-4 h-4" />
        <span>{{ t.filterBtn }}</span>
        <span v-if="activeFilterCount > 0"
              class="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400 text-black text-[10px] font-bold leading-none">
          {{ activeFilterCount }}
        </span>
      </button>

      <!-- PC: Lang + FontSize chips (visible after scroll past hero) -->
      <Transition name="state-chip">
        <div v-if="!topControlsVisible" class="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0">
          <div class="flex items-center gap-1.5 h-10 px-2.5 border border-white/15 hover:border-white/30 transition-all">
            <Globe class="w-3 h-3 text-[#666] pointer-events-none flex-shrink-0" />
            <select :value="locale"
                    @change="$emit('update:locale', $event.target.value); $emit('markHintSeen')"
                    class="appearance-none bg-transparent text-[#888] hover:text-white/80 focus:outline-none cursor-pointer text-[11px] tracking-widest uppercase">
              <option value="zh-TW" class="bg-[#1a1a1a] text-white text-sm normal-case">繁中</option>
              <option value="en"    class="bg-[#1a1a1a] text-white text-sm">EN</option>
              <option value="ja"    class="bg-[#1a1a1a] text-white text-sm">JA</option>
              <option value="ko"    class="bg-[#1a1a1a] text-white text-sm">KO</option>
            </select>
          </div>
          <button @click="$emit('toggleFontSize')"
                  :class="['flex items-center gap-0.5 h-10 px-2.5 border transition-all',
                           fontSize === 'large' ? 'border-emerald-400/50 text-emerald-400 bg-emerald-400/10' : 'border-white/15 text-[#555] hover:border-white/30 hover:text-[#888]']">
            <span style="font-size:10px" class="leading-none">A</span>
            <span style="font-size:14px" class="leading-none">A</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Row 2 (PC only): Region chips + Identity + Day + Budget + Favorites -->
    <div class="hidden lg:flex items-center gap-x-4 mt-3 flex-wrap gap-y-2">

      <!-- Region chips -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button v-for="opt in regionOptions" :key="opt.value"
                @click="$emit('regionChange', opt.value)"
                :class="['px-2.5 py-1 text-xs border tracking-wider transition-all whitespace-nowrap',
                         selectedRegion === opt.value
                           ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium'
                           : 'border-white/10 text-[#888] hover:border-white/25']">
          {{ opt.label }}
          <span class="text-[10px] opacity-50 ml-1">{{ opt.count }}</span>
        </button>
      </div>

      <div class="w-px h-4 bg-white/10 flex-shrink-0"></div>

      <!-- Identity chips -->
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

      <!-- Day chips -->
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

      <!-- Budget slider -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-[10px] text-[#555] tracking-widest uppercase whitespace-nowrap">{{ t.budget }}</span>
        <input type="range" min="0" :max="budgetMax" step="100"
               :value="maxBudget === Infinity ? budgetMax : maxBudget"
               @input="$emit('update:maxBudget', Number($event.target.value) >= budgetMax ? Infinity : Number($event.target.value))"
               class="w-28 accent-emerald-400 cursor-pointer" />
        <span class="text-xs text-[#f4f4f4] w-14 text-right tabular-nums">
          {{ budgetDisplay(maxBudget) }}
        </span>
      </div>

      <!-- Favorites (PC) -->
      <button @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
              :class="['flex items-center gap-1.5 px-3 py-1 border text-xs tracking-wider transition-all ml-auto flex-shrink-0',
                       showFavoritesOnly ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/10 text-[#888] hover:border-white/25']">
        <Heart :class="['w-3.5 h-3.5', showFavoritesOnly ? 'fill-emerald-400' : '']" />
        {{ t.favorites }}
      </button>
    </div>
  </div>

  <!-- Mobile Filter Sheet (bottom) -->
  <Transition name="slide-up">
    <div v-if="showMobileFilter"
         class="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
         @click.self="showMobileFilter = false">
      <div class="w-full bg-[#0d0d0d] border-t border-white/15 rounded-t-2xl px-5 pt-5 pb-10 flex flex-col gap-5 overflow-y-auto"
           style="max-height: 85vh">

        <!-- Sheet Header -->
        <div class="flex items-center justify-between">
          <span class="text-white text-sm font-medium tracking-wide">{{ t.filterBtn }}</span>
          <div class="flex items-center gap-4">
            <button @click="resetFilters" class="text-[11px] text-[#888] tracking-widest uppercase hover:text-white/60 transition-colors">
              {{ t.resetFilter }}
            </button>
            <button @click="showMobileFilter = false" class="text-white/40 hover:text-white transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- 地區 -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.region }}</label>
          <select :value="selectedRegion"
                  @change="$emit('regionChange', $event.target.value); showMobileFilter = false"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }} ({{ opt.count }})
            </option>
          </select>
        </div>

        <!-- 看身分 -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.identity }}</label>
          <select :value="selectedIdentity"
                  @change="$emit('update:selectedIdentity', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in identityOptions" :key="opt.value" :value="opt.value">{{ t[opt.labelKey] }}</option>
          </select>
        </div>

        <!-- 看日期 -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.day }}</label>
          <select :value="selectedDay"
                  @change="$emit('update:selectedDay', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in dayOptions" :key="opt.value" :value="opt.value">{{ t[opt.labelKey] }}</option>
          </select>
        </div>

        <!-- 球場日 -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.golfDay }}</label>
          <select :value="selectedGolfDay"
                  @change="$emit('update:selectedGolfDay', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option :value="ALL_GOLF_DAY">{{ t.golfDayAll }}</option>
            <option v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d" :value="d">
              {{ d }}{{ d === todayWeekday ? ' ★' : '' }}
            </option>
          </select>
        </div>

        <!-- 預算上限 -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.budget }}</label>
            <span class="text-xs text-[#f4f4f4] tabular-nums">{{ budgetDisplay(maxBudget) }}</span>
          </div>
          <input type="range" min="0" :max="budgetMax" step="100"
                 :value="maxBudget === Infinity ? budgetMax : maxBudget"
                 @input="$emit('update:maxBudget', Number($event.target.value) >= budgetMax ? Infinity : Number($event.target.value))"
                 class="w-full accent-emerald-400 cursor-pointer" />
        </div>

        <!-- 最愛 -->
        <button @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
                :class="['flex items-center gap-2 px-4 py-3 border transition-all text-sm rounded',
                         showFavoritesOnly ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/10 text-[#888]']">
          <Heart :class="['w-4 h-4', showFavoritesOnly ? 'fill-emerald-400' : '']" />
          {{ t.favOnly }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.state-chip-enter-active, .state-chip-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.state-chip-enter-from, .state-chip-leave-to { opacity: 0; transform: translateY(-4px); }
.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.25s ease; }
.slide-up-enter-active > div:last-child, .slide-up-leave-active > div:last-child { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; }
.slide-up-enter-from > div:last-child, .slide-up-leave-to > div:last-child { transform: translateY(100%); }
</style>
```

- [ ] **Step 2：在 Home.vue 引入 FilterBar 並替換 filter-bar 區塊**

```js
import FilterBar from '../components/FilterBar.vue'
```

找到 `<!-- Filter Controls (Sticky) -->` 整段（`<div id="filter-bar" ...>` 到結束的 `</div>`），替換為：

```html
<FilterBar
  :regionOptions="regionOptions"
  :selectedRegion="selectedRegion"
  :searchQuery="searchQuery"
  :selectedIdentity="selectedIdentity"
  :selectedDay="selectedDay"
  :maxBudget="maxBudget"
  :budgetMax="budgetMax"
  :viewMode="viewMode"
  :showFavoritesOnly="showFavoritesOnly"
  :selectedGolfDay="selectedGolfDay"
  :weekdays="weekdays"
  :todayWeekday="todayWeekday"
  :t="t"
  :locale="locale"
  :filterVisible="filterVisible"
  :activeFilterCount="activeFilterCount"
  :topControlsVisible="topControlsVisible"
  :fontSize="fontSize"
  :hintSeen="hintSeen"
  :ALL_GOLF_DAY="ALL_GOLF_DAY"
  v-model:showMobileFilter="showMobileFilter"
  @update:searchQuery="searchQuery = $event"
  @update:selectedIdentity="selectedIdentity = $event"
  @update:selectedDay="selectedDay = $event"
  @update:maxBudget="maxBudget = $event"
  @update:viewMode="viewMode = $event"
  @update:showFavoritesOnly="showFavoritesOnly = $event"
  @update:selectedGolfDay="selectedGolfDay = $event"
  @update:locale="locale = $event"
  @regionChange="onRegionChange"
  @toggleFontSize="toggleFontSize"
  @markHintSeen="markHintSeen"
/>
```

同時，刪除 Home.vue template 中殘留的手機版語系/字級 fixed 小按鈕（`<!-- 手機版：字級 & 語系狀態 fixed 小按鈕 -->`）—— 這些已被 FilterBar 的 mobile 體驗覆蓋，不再需要。

**注意：** Home.vue 中的捲動後語系/字級 chip 區塊（`<Transition name="state-chip">...`）也已移入 FilterBar，一併刪除。

- [ ] **Step 3：確認 FilterBar 完整功能**

瀏覽器逐一驗證：
- PC Row 1：搜尋（清除按鈕）、視圖切換（表格/卡片）
- PC Row 2：地區 chips（URL 切換）、身分 chips、日期 chips、預算滑桿（數值顯示）、最愛 toggle
- 手機：搜尋、視圖切換 icon、篩選按鈕 → 底部 sheet 含全部下拉 + 重置
- 篩選 badge 數字隨篩選條件正確更新

- [ ] **Step 4：Commit**

```bash
git add src/components/FilterBar.vue src/pages/Home.vue
git commit -m "feat: add FilterBar with PC chips + mobile sheet filter UI"
```

---

### Task 7：清理 Home.vue & 最終驗證

**Files:**
- Modify: `src/pages/Home.vue`

- [ ] **Step 1：清理 Home.vue script import**

script 頂部只保留真正需要的 import：

```js
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import golfDataJson from '../data/golf_courses.json'
import { Bell, X } from 'lucide-vue-next'
import { ALL_REGION, DEFAULT_PAGE_TITLE, SITE_URL, REGION_SLUGS, REGION_TO_SLUG, REGION_PAGE_TITLES, REGION_NAV_LABELS } from '../constants/regions.js'
import { features, changelog } from '../data/about.js'
import FilterBar from '../components/FilterBar.vue'
import CourseTable from '../components/CourseTable.vue'
import CourseCards from '../components/CourseCards.vue'
import AboutModal from '../components/AboutModal.vue'
import InstallGuideModal from '../components/InstallGuideModal.vue'
```

移除不再使用的 lucide import：`Utensils, Droplets, CreditCard, ChevronDown, Globe, Search, Phone, ExternalLink, Heart, GolfFlag`。

若 `features, changelog` 已移入 AboutModal 內部 import，也可從 Home.vue 移除（但需確認 AboutModal 自己 import 了）。

- [ ] **Step 2：清理 Home.vue `<style>` 區塊**

刪除已移入子元件 scoped style 的全域 CSS：
- `.guide-enter-active` / `.guide-leave-active` / `.guide-enter-from` / `.guide-leave-to`（已在 AboutModal、InstallGuideModal）
- `.state-chip-enter-active` 等（已在 FilterBar）

保留全域必要樣式：
```css
html { scroll-behavior: smooth; scrollbar-gutter: stable; }
button { cursor: pointer; transition: opacity 0.12s ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
button:active { opacity: 0.75; }
a, select { touch-action: manipulation; }
.safe-top { top: calc(1rem + env(safe-area-inset-top)); }
.hl { color: rgba(255,255,255,0.9); font-weight: 500; }
@media (min-width: 640px) { .safe-top { top: calc(1.5rem + env(safe-area-inset-top)); } }
.hint-pulse { animation: hint-ring 1.5s ease-in-out 3; }
@keyframes hint-ring {
  0%, 100% { border-color: rgba(255,255,255,0.1); box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  50% { border-color: rgba(52,211,153,0.55); box-shadow: 0 0 0 3px rgba(52,211,153,0.12); }
}
.update-banner-enter-active, .update-banner-leave-active { transition: transform 0.3s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease; }
.update-banner-enter-from, .update-banner-leave-to { transform: translateY(100%); opacity: 0; }
```

- [ ] **Step 3：確認 Home.vue 行數**

```bash
wc -l src/pages/Home.vue
```

目標 400 行以下。若仍超過，找出殘留的舊模板或 script 程式碼。

- [ ] **Step 4：完整功能驗證清單**

瀏覽器逐一測試：

1. 地區切換（PC chips → URL 變更，手機下拉 → URL 變更 + sheet 關閉）
2. 搜尋球場（輸入名稱即時過濾）
3. 看身分切換（來賓/會員/同組/團體）→ 排序變更 + 欄位 emerald 高亮
4. 看日期切換（平日/假日）→ 排序變更
5. 預算滑桿 → 即時過濾球場數量
6. 球場日過濾（手機 sheet）
7. 表格/卡片視圖切換（兩尺寸均可切換，localStorage 持久化）
8. 收藏心型 → localStorage 持久化
9. 僅顯示最愛 toggle
10. About modal 開啟/關閉 / tabs 正常
11. 手機「加入主畫面」modal 正常
12. Update banner 測試（dev console 執行 `window.__simulateUpdate()`）
13. 語系切換（繁/EN/JA/KO）
14. 字型大小 toggle

- [ ] **Step 5：最終 Commit**

```bash
git add src/pages/Home.vue
git commit -m "refactor: clean up Home.vue imports and styles, finalize component split"
```
