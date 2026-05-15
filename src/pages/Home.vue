<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import golfDataJson from '../data/golf_courses.json'
import { ChevronDown, Globe, X, Bell } from 'lucide-vue-next'
import AboutModal from '../components/AboutModal.vue'
import CourseTable from '../components/CourseTable.vue'
import CourseCards from '../components/CourseCards.vue'
import InstallGuideModal from '../components/InstallGuideModal.vue'
import FilterBar from '../components/FilterBar.vue'
import { ALL_REGION, DEFAULT_PAGE_TITLE, SITE_URL, REGION_SLUGS, REGION_TO_SLUG, REGION_PAGE_TITLES } from '../constants/regions.js'
import { dict, regionMap, NAV_LABELS_MAP } from '../i18n/dict.js'

const route = useRoute()
const router = useRouter()
const selectedRegion = ref(route.params.id ? (REGION_SLUGS[route.params.id] || ALL_REGION) : ALL_REGION)
const regionCourses = computed(() =>
  selectedRegion.value === ALL_REGION ? golfDataJson : golfDataJson.filter(c => c.region === selectedRegion.value)
)

watch(() => route.params.id, (id) => {
  selectedRegion.value = id ? (REGION_SLUGS[id] || ALL_REGION) : ALL_REGION
})

const pageTitle = computed(() => (REGION_PAGE_TITLES[selectedRegion.value] || DEFAULT_PAGE_TITLE) + ' - Golffee')
const pageDesc = computed(() => {
  if (selectedRegion.value === ALL_REGION) return 'Golffee 整合全台高爾夫球場最新收費資訊，一鍵查詢平日、假日、來賓與會員價格，支援地區篩選、排序與收藏，出發前掌握最新報價，不用再打電話詢問。'
  return `${REGION_PAGE_TITLES[selectedRegion.value]}共 ${regionCourses.value.length} 座，快速查詢平日、假日、來賓與會員收費，掌握最新報價。`
})
const pageUrl = computed(() => {
  const slug = REGION_TO_SLUG[selectedRegion.value]
  return slug ? `${SITE_URL}/region/${slug}` : `${SITE_URL}/`
})

const websiteJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Golffee',
  url: `${SITE_URL}/`,
  description: '全台高爾夫球場即時收費資訊查詢，包含平日、假日、來賓與會員價格',
  inLanguage: 'zh-TW',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?search={search_term_string}` },
    'query-input': 'required name=search_term_string'
  }
})

const itemListJsonLd = computed(() => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: selectedRegion.value === ALL_REGION ? '全台高爾夫球場收費列表' : `${selectedRegion.value}高爾夫球場收費列表`,
  description: pageDesc.value,
  numberOfItems: regionCourses.value.length,
  itemListElement: regionCourses.value.map((course, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'SportsActivityLocation',
      name: course.name,
      address: { '@type': 'PostalAddress', addressRegion: course.region, addressCountry: 'TW' }
    }
  }))
}))

const ogTitle = computed(() => `Golffee - ${REGION_PAGE_TITLES[selectedRegion.value] || DEFAULT_PAGE_TITLE}`)

useHead(computed(() => ({
  title: pageTitle.value,
  htmlAttrs: { lang: 'zh-TW' },
  meta: [
    { name: 'description', content: pageDesc.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: pageUrl.value },
    { property: 'og:title', content: ogTitle.value },
    { property: 'og:description', content: pageDesc.value },
    { property: 'og:image', content: `${SITE_URL}/og-image.jpg` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:url', content: pageUrl.value },
    { name: 'twitter:title', content: ogTitle.value },
    { name: 'twitter:description', content: pageDesc.value },
    { name: 'twitter:image', content: `${SITE_URL}/og-image.jpg` },
  ],
  link: [
    { rel: 'canonical', href: pageUrl.value }
  ],
  script: [
    { type: 'application/ld+json', innerHTML: websiteJsonLd },
    { type: 'application/ld+json', innerHTML: itemListJsonLd.value }
  ]
})))

const locale = ref('zh-TW')

const t = computed(() => dict[locale.value])

const getRegionName = (r) => {
  if (r === ALL_REGION) return t.value.all
  const map = regionMap[locale.value]
  return map ? (map[r] || r) : r
}

const getCourseName = (c) => {
  if (locale.value === 'en') return c.name_en || c.name
  if (locale.value === 'ja') return c.name_ja || c.name
  if (locale.value === 'ko') return c.name_ko || c.name
  return c.name
}

const localizedNavLabels = computed(() => NAV_LABELS_MAP[locale.value] ?? NAV_LABELS_MAP['zh-TW'])

const parseRemarks = (text) => {
  if (!text || text === '-') return []
  return text
    .split('。')
    .map(s => s.trim())
    .filter(Boolean)
}

const regions = computed(() => [ALL_REGION, ...new Set(golfDataJson.map(c => c.region))])
const regionCounts = { [ALL_REGION]: golfDataJson.length }
golfDataJson.forEach(c => { regionCounts[c.region] = (regionCounts[c.region] || 0) + 1 })

const searchQuery = ref('')
const selectedIdentity = ref('guest')  // 'guest' | 'member' | 'mGuest' | 'team'
const selectedDay = ref('weekday')     // 'weekday' | 'holiday'
const maxBudget = ref(Infinity)
const viewMode = ref(localStorage.getItem('golffee_view') || 'table')
const showMobileFilter = ref(false)

watch(viewMode, (v) => localStorage.setItem('golffee_view', v))

const ALL_GOLF_DAY = '全部'
const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const todayDate = ref(new Date())
const todayWeekday = computed(() => weekdays[todayDate.value.getDay()])
const selectedGolfDay = ref(ALL_GOLF_DAY)

const parseNum = (v) => {
  const n = parseInt(v)
  return isNaN(n) ? Infinity : n
}

const favorites = ref([])
const showFavoritesOnly = ref(false)
const showInstallGuide = ref(false)
const showAbout = ref(false)
const desktopMq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)') : null
const isDesktop = ref(desktopMq?.matches ?? false)
const onDesktopChange = (e) => { isDesktop.value = e.matches }


let _scrollY = 0
watch([showAbout, showInstallGuide], ([about, guide]) => {
  const locked = about || guide
  if (locked) {
    _scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${_scrollY}px`
    document.body.style.width = '100%'
  } else {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, _scrollY)
  }
})
const hasUpdate = ref(false)
const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null
const buildDate = (() => {
  if (!currentVersion) return ''
  const d = new Date(Number(currentVersion))
  return `v${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
})()

function dismissUpdate() {
  hasUpdate.value = false
}

const RELOAD_COOLDOWN_MS = 60_000

async function reloadPage() {
  // 記錄 reload 時間，避免 reload 後立刻再觸發 banner
  sessionStorage.setItem('golffee_reload_ts', Date.now().toString())
  // 先通知 waiting SW 跳過等待，確保 reload 後載入最新版本
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }))
      }
    } catch {}
  }
  location.reload()
}

let versionCheckInFlight = false
const VERSION_FETCH_TIMEOUT_MS = 10_000
async function checkVersion() {
  // 已顯示 banner 或不在 production 就跳過
  if (import.meta.env.DEV || !currentVersion || versionCheckInFlight || hasUpdate.value) return
  // reload 後冷卻期內不檢查（避免 SW 尚未完全更新就再次觸發 banner）
  const reloadTs = sessionStorage.getItem('golffee_reload_ts')
  if (reloadTs && Date.now() - Number(reloadTs) < RELOAD_COOLDOWN_MS) return
  versionCheckInFlight = true
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), VERSION_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { signal: ctrl.signal })
    const data = await res.json()
    if (data.version && data.version !== currentVersion) {
      hasUpdate.value = true
    }
  } catch {} finally {
    clearTimeout(timer)
    versionCheckInFlight = false
  }
}
// ── 文字大小（只縮放資料區，UI chrome 不受影響）───────────────
const fontSize = ref((typeof window !== 'undefined' && localStorage.getItem('golffee_font_size')) || 'normal')

function applyFontSize(val) {
  const zoom = val === 'large' ? '1.15' : ''
  ;['golffee-table', 'golffee-cards'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.style.zoom = zoom
  })
}

function toggleFontSize() {
  markHintSeen()
  fontSize.value = fontSize.value === 'normal' ? 'large' : 'normal'
  localStorage.setItem('golffee_font_size', fontSize.value)
  applyFontSize(fontSize.value)
}

// ── 功能提示 pulse（首次造訪才顯示）──────────────────────────
const hintSeen = ref(typeof window !== 'undefined' && !!localStorage.getItem('golffee_hint_seen'))

function markHintSeen() {
  if (hintSeen.value) return
  hintSeen.value = true
  localStorage.setItem('golffee_hint_seen', '1')
}

const isStandalone = typeof window !== 'undefined' && (
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches
)

const toggleFavorite = (name) => {
  const idx = favorites.value.indexOf(name)
  if (idx > -1) {
    favorites.value.splice(idx, 1)
  } else {
    favorites.value.push(name)
  }
  localStorage.setItem('golffee_favorites', JSON.stringify(favorites.value))
}

const isFavorite = (name) => favorites.value.includes(name)

const priceField = computed(() => {
  if (selectedIdentity.value === 'member') return 'member'
  const dayKey = selectedDay.value === 'weekday' ? 'Weekday' : 'Holiday'
  const map = { guest: 'guest', mGuest: 'memberGuest', team: 'team' }
  return map[selectedIdentity.value] + dayKey
})

const budgetMax = computed(() => {
  const prices = golfDataJson
    .map(c => parseInt(c[priceField.value]))
    .filter(n => !isNaN(n))
  return prices.length ? Math.max(...prices) : 20000
})

const regionOptions = computed(() =>
  regions.value.map(r => ({
    value: r,
    label: getRegionName(r),
    count: regionCounts[r] ?? 0,
  }))
)

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

const filterVisible = ref(true)
const topControlsVisible = ref(true)   // Hero 頂部按鈕是否可見
let lastScrollY = 0
let scrollUpAccum = 0
const SHOW_THRESHOLD = 200

let rafPending = false
const handleScroll = () => {
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    const currentScrollY = window.scrollY
    const contentLayer = document.getElementById('content-layer')
    const filterBar = document.getElementById('filter-bar')
    const contentTop = contentLayer ? contentLayer.offsetTop : window.innerHeight * 0.7
    const filterHeight = filterBar ? filterBar.offsetHeight : 0
    const activationPoint = contentTop + filterHeight

    // 捲過 Hero 後才顯示 filter bar 的狀態 chips
    topControlsVisible.value = currentScrollY < contentTop - 40

    if (currentScrollY < activationPoint) {
      filterVisible.value = true
      scrollUpAccum = 0
      lastScrollY = currentScrollY
      return
    }

    const delta = currentScrollY - lastScrollY
    lastScrollY = currentScrollY

    if (delta > 0) {
      scrollUpAccum = 0
      filterVisible.value = false
    } else {
      scrollUpAccum += Math.abs(delta)
      if (scrollUpAccum >= SHOW_THRESHOLD) {
        filterVisible.value = true
      }
    }
  })
}

const onRegionChange = async (newRegion) => {
  if (newRegion !== undefined) selectedRegion.value = newRegion
  const slug = REGION_TO_SLUG[selectedRegion.value]
  if (slug) await router.push(`/region/${slug}`)
  else await router.push('/')
  await nextTick()
  const el = document.getElementById('content-layer')
  if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedIdentity.value !== 'guest') count++
  if (selectedDay.value !== 'weekday') count++
  if (maxBudget.value !== Infinity) count++
  if (selectedGolfDay.value !== ALL_GOLF_DAY) count++
  if (showFavoritesOnly.value) count++
  return count
})

const scrollToContent = () => {
  document.getElementById('content-layer')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

let versionTimer = null
let midnightTimer = null
function scheduleMidnight() {
  const now = new Date()
  const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
  midnightTimer = setTimeout(() => { todayDate.value = new Date(); scheduleMidnight() }, ms)
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // reload 後冷卻期內不因切換分頁而觸發
    const reloadTs = sessionStorage.getItem('golffee_reload_ts')
    if (reloadTs && Date.now() - Number(reloadTs) < RELOAD_COOLDOWN_MS) return
    checkVersion()
  }
}

onMounted(() => {
  favorites.value = JSON.parse(localStorage.getItem('golffee_favorites') || '[]')
  if (fontSize.value === 'large') applyFontSize('large')
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  desktopMq?.addEventListener('change', onDesktopChange)
  // 延遲 8 秒再做初次版本檢查，讓 SW 有時間完全接管後才比對
  setTimeout(() => checkVersion(), 8000)
  versionTimer = setInterval(checkVersion, 5 * 60 * 1000)
  scheduleMidnight()
  if (import.meta.env.DEV) {
    window.__simulateUpdate = () => { hasUpdate.value = true }
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  desktopMq?.removeEventListener('change', onDesktopChange)
  clearInterval(versionTimer)
  clearTimeout(midnightTimer)
})

</script>

<template>
  <div class="relative flex flex-col min-h-dvh bg-[#050505] text-[#f4f4f4] font-sans selection:bg-emerald-500 selection:text-white">

    <!-- PWA 狀態列遮罩：填滿 safe-area-inset-top 避免內容透出 -->
    <div v-if="isStandalone"
         class="fixed top-0 left-0 right-0 z-40 bg-[#050505]"
         style="height: env(safe-area-inset-top)"></div>

    <!-- Top-Left Install Button (Mobile, non-standalone only) -->
    <button v-if="!isStandalone"
            @click="showInstallGuide = true"
            class="safe-top absolute left-4 sm:left-6 z-50 lg:hidden flex items-center gap-1.5 h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border border-white/10 text-white/60 text-xs tracking-wider hover:text-white/90 hover:border-white/25 transition-all">
      <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v13M8 11l4 4 4-4"/>
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
      </svg>
      加入主畫面
    </button>

    <!-- Top-Right Controls -->
    <div class="safe-top absolute right-4 sm:right-6 z-50 flex items-center gap-2">
      <button @click="showAbout = true"
              class="flex items-center h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border border-white/10 text-white/60 text-xs tracking-wider hover:text-white/90 hover:border-white/25 transition-all">
        {{ t.about }}
      </button>

      <!-- Font Size Toggle -->
      <button @click="toggleFontSize"
              @animationend="markHintSeen"
              :aria-label="fontSize === 'large' ? '縮小文字' : '放大文字'"
              :class="['flex items-center gap-0.5 h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border hover:border-white/25 transition-all select-none', hintSeen ? 'border-white/10' : 'hint-pulse']">
        <span :class="['leading-none transition-colors', fontSize === 'normal' ? 'text-white/90' : 'text-white/30']" style="font-size: 11px">A</span>
        <span :class="['leading-none transition-colors', fontSize === 'large'  ? 'text-white/90' : 'text-white/30']" style="font-size: 15px">A</span>
      </button>
      <div :class="['flex items-center gap-2 h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border text-xs tracking-wider', hintSeen ? 'border-white/10' : 'hint-pulse']">
        <Globe class="w-3.5 h-3.5 text-white/70" />
        <select v-model="locale" @change="markHintSeen" class="bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-2">
          <option value="zh-TW" class="bg-black text-base">繁體中文</option>
          <option value="en" class="bg-black text-base">English</option>
          <option value="ja" class="bg-black text-base">日本語</option>
          <option value="ko" class="bg-black text-base">한국어</option>
        </select>
      </div>
    </div>

    <!-- Hero Section (Compressed to 70vh) -->
    <div class="relative h-[70vh] w-full flex flex-col items-center justify-center pb-12 pt-24">

      <!-- Background Image Layer -->
      <div class="absolute inset-0 z-0">
        <img src="../assets/hero-bg.png" alt="Golf Course Hero" class="w-full h-full object-cover object-center opacity-70" fetchpriority="high" loading="eager" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
      </div>

      <!-- Hero Header -->
      <header class="z-10 text-center flex flex-col items-center">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-medium tracking-wide text-white drop-shadow-lg px-4" style="letter-spacing: -0.02em;">{{ t.title }}</h1>
        <p class="text-white/80 mt-4 text-xs md:text-sm font-light tracking-[0.2em] uppercase">
          {{ t.subtitle }}
        </p>
      </header>

      <!-- Absolute Bottom Scroll Indicator inside Hero -->
      <button @click="scrollToContent" class="absolute bottom-16 z-10 flex flex-col items-center text-white/50 hover:text-white transition-colors cursor-pointer group">
        <span class="text-xs tracking-[0.2em] font-light mb-3 uppercase opacity-0 group-hover:opacity-100 transition-opacity">{{ t.explore }}</span>
        <ChevronDown class="w-6 h-6 animate-bounce opacity-80" />
      </button>

    </div>

    <!-- Content Section (Floating Over Hero via -mt-32) -->
    <div id="content-layer" class="relative z-20 flex flex-col flex-1 -mt-24 pt-0 bg-[#050505] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
      <div class="w-full max-w-screen-2xl mx-auto px-6 lg:px-12 flex-1 min-h-dvh" style="padding-bottom: calc(5rem + env(safe-area-inset-bottom))">

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

        <!-- Table View (desktop only; mobile always falls back to cards) -->
        <div id="golffee-table" :class="['pt-6', viewMode === 'table' ? 'hidden lg:block' : 'hidden']">
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

        <!-- Card View (always on mobile when table mode, always when card mode) -->
        <div id="golffee-cards" :class="viewMode === 'card' ? 'block' : 'block lg:hidden'">
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

      </div>

      <!-- Region Links -->
      <nav class="px-6 lg:px-12 py-12 lg:py-16 border-t border-white/10 mt-12 lg:mt-16" aria-label="地區專頁">
        <p class="text-xs tracking-[0.2em] text-[#555] uppercase mb-6">{{ t.regionNav }}</p>
        <div class="flex flex-wrap gap-3">
          <RouterLink v-for="(label, slug) in localizedNavLabels"
             :key="slug"
             :to="`/region/${slug}`"
             class="px-4 py-2 text-xs border border-white/10 text-[#777] hover:border-emerald-400/40 hover:text-emerald-400 transition-all tracking-wider">
            {{ label }}
          </RouterLink>
        </div>
      </nav>

      <!-- Update Banner -->
      <Transition name="update-banner">
        <div v-if="hasUpdate"
             class="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-3 bg-emerald-500 text-black text-sm font-medium"
             style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))">
          <span class="flex items-center gap-2 min-w-0 truncate"><Bell class="w-4 h-4 flex-shrink-0" />{{ t.updateMsg }}</span>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="reloadPage"
                    class="bg-black text-emerald-400 text-sm font-semibold px-4 py-2 rounded-full hover:bg-black/80 transition-colors">
              立即更新
            </button>
            <button @click="dismissUpdate"
                    class="w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                    aria-label="關閉通知">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Persistent Footer -->
      <footer class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center" style="padding-top: 0.5rem; padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));">
        <p class="text-white text-xs tracking-[0.2em] font-light opacity-40">
          ©2026 KingsleyZheng · {{ buildDate }}
        </p>
        <!-- 回到頂端 -->
        <button @click="scrollToTop"
                aria-label="回到頂端"
                class="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 border border-white/20 text-white/50 hover:border-white/50 hover:text-white/90 hover:bg-white/5 active:bg-white/10 transition-all duration-150 text-sm leading-none select-none">
          ↑
        </button>
      </footer>
    </div>

    <!-- About Modal -->
    <AboutModal
      :show="showAbout"
      :t="t"
      :isDesktop="isDesktop"
      :isStandalone="isStandalone"
      @close="showAbout = false"
    />

    <!-- Install Guide Modal -->
    <InstallGuideModal
      :show="showInstallGuide"
      :isStandalone="isStandalone"
      @close="showInstallGuide = false"
    />

  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
}
button {
  cursor: pointer;
  transition: opacity 0.12s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
button:active {
  opacity: 0.75;
}
a, select {
  touch-action: manipulation;
}
.safe-top {
  top: calc(1rem + env(safe-area-inset-top));
}
.hl {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}
@media (min-width: 640px) {
  .safe-top {
    top: calc(1.5rem + env(safe-area-inset-top));
  }
}
.hint-pulse {
  animation: hint-ring 1.5s ease-in-out 3;
}
@keyframes hint-ring {
  0%, 100% { border-color: rgba(255,255,255,0.1); box-shadow: 0 0 0 0 rgba(52,211,153,0); }
  50%       { border-color: rgba(52,211,153,0.55); box-shadow: 0 0 0 3px rgba(52,211,153,0.12); }
}
.update-banner-enter-active,
.update-banner-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease;
}
.update-banner-enter-from,
.update-banner-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
