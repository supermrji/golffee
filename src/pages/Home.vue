<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import golfDataJson from '../data/golf_courses.json'
import { Utensils, Droplets, CreditCard, ChevronDown, Globe, Search, Phone, ExternalLink, Heart, X, Bell } from 'lucide-vue-next'
import GolfFlag from '../GolfFlag.vue'
import { ALL_REGION, DEFAULT_PAGE_TITLE, SITE_URL, REGION_SLUGS, REGION_TO_SLUG, REGION_PAGE_TITLES, REGION_NAV_LABELS } from '../constants/regions.js'
import { features, changelog } from '../data/about.js'

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

const dict = {
  'zh-TW': {
    title: '全台高爾夫球場收費查詢',
    subtitle: 'Taiwan Green Fees & Facilities',
    explore: '探索',
    region: '縣市',
    all: '全部',
    course: '球場名稱',
    guest: '來賓',
    member: '會員',
    mGuest: '同組',
    team: '團體',
    amenities: '設施',
    weekday: '平日',
    holiday: '假日',
    remarks: '備註',
    search: '搜尋球場',
    searchPlaceholder: '球場名稱',
    update: '更新',
    noData: '無資料',
    favorites: '我的最愛',
    favOnly: '僅顯示最愛',
    holes: '洞數',
    sort: '排序',
    sortDefault: '預設',
    sortGuestWk: '來賓平日 低→高',
    sortGuestHol: '來賓假日 低→高',
    sortMember: '會員 低→高',
    golfDay: '球場日',
    golfDayAll: '全部',
    golfDayToday: '今天',
    noGolfDay: '無固定',
    closed: '已停業',
    noResult: '找不到符合條件的球場',
    noResultSub: '試試調整篩選條件',
    expand: '▼ 展開',
    collapse: '▲ 收起',
    about: '關於',
    regionNav: '地區專頁'
  },
  'en': {
    title: 'Golf Fees.',
    subtitle: 'Taiwan Green Fees & Facilities',
    explore: 'Explore',
    region: 'Region',
    all: 'All',
    course: 'Course',
    guest: 'Guest',
    member: 'Member',
    mGuest: 'M-Guest',
    team: 'Team',
    amenities: 'Amenities',
    weekday: 'Wk',
    holiday: 'Hol',
    remarks: 'Remarks',
    search: 'Search Course',
    searchPlaceholder: 'Course name',
    update: 'Updated',
    noData: '-',
    favorites: 'Favorites',
    favOnly: 'Fav Only',
    holes: 'Holes',
    sort: 'Sort',
    sortDefault: 'Default',
    sortGuestWk: 'Guest Wk ↓',
    sortGuestHol: 'Guest Hol ↓',
    sortMember: 'Member ↓',
    golfDay: 'Golf Day',
    golfDayAll: 'All',
    golfDayToday: 'Today',
    noGolfDay: 'Varies',
    closed: 'Closed',
    noResult: 'No courses found',
    noResultSub: 'Try adjusting your filters',
    expand: '▼ More',
    collapse: '▲ Less',
    about: 'About',
    regionNav: 'Regional Pages'
  },
  'ja': {
    title: 'ゴルフ料金ガイド',
    subtitle: 'Taiwan Green Fees & Facilities',
    explore: '探す',
    region: '地域',
    all: 'すべて',
    course: 'コース名',
    guest: 'ビジター',
    member: '会員',
    mGuest: '同伴',
    team: 'グループ',
    amenities: '設備',
    weekday: '平日',
    holiday: '休日',
    remarks: '備考',
    search: 'コースを検索',
    searchPlaceholder: 'コース名',
    update: '更新',
    noData: '-',
    favorites: 'お気に入り',
    favOnly: 'お気に入りのみ',
    holes: 'ホール',
    sort: '並び替え',
    sortDefault: 'デフォルト',
    sortGuestWk: 'ビジター平日 安い順',
    sortGuestHol: 'ビジター休日 安い順',
    sortMember: '会員 安い順',
    golfDay: 'ゴルフ曜日',
    golfDayAll: 'すべて',
    golfDayToday: '今日',
    noGolfDay: '不定',
    closed: '閉業',
    noResult: '条件に合うコースが見つかりません',
    noResultSub: '絞り込み条件を変えてみてください',
    expand: '▼ 展開',
    collapse: '▲ 閉じる',
    about: 'について',
    regionNav: '地域ページ'
  },
  'ko': {
    title: '골프 요금 가이드',
    subtitle: 'Taiwan Green Fees & Facilities',
    explore: '탐색',
    region: '지역',
    all: '전체',
    course: '골프장 이름',
    guest: '비회원',
    member: '회원',
    mGuest: '동반',
    team: '단체',
    amenities: '시설',
    weekday: '평일',
    holiday: '휴일',
    remarks: '비고',
    search: '골프장 검색',
    searchPlaceholder: '골프장 이름',
    update: '업데이트',
    noData: '-',
    favorites: '즐겨찾기',
    favOnly: '즐겨찾기만',
    holes: '홀수',
    sort: '정렬',
    sortDefault: '기본',
    sortGuestWk: '비회원 평일 낮은순',
    sortGuestHol: '비회원 휴일 낮은순',
    sortMember: '회원 낮은순',
    golfDay: '골프 요일',
    golfDayAll: '전체',
    golfDayToday: '오늘',
    noGolfDay: '미정',
    closed: '폐업',
    noResult: '조건에 맞는 골프장이 없습니다',
    noResultSub: '필터 조건을 변경해 보세요',
    expand: '▼ 더보기',
    collapse: '▲ 접기',
    about: '정보',
    regionNav: '지역 페이지'
  }
}

const t = computed(() => dict[locale.value])

const regionMap = {
  en: {
    '台北市、新北市': 'Taipei / New Taipei',
    '桃園地區': 'Taoyuan',
    '新竹、苗栗': 'Hsinchu / Miaoli',
    '台中、彰化、南投': 'Taichung / Changhua / Nantou',
    '嘉義、台南、高雄、屏東': 'South Taiwan',
    '花東地區': 'East Taiwan'
  },
  ja: {
    '台北市、新北市': '台北・新北',
    '桃園地區': '桃園',
    '新竹、苗栗': '新竹・苗栗',
    '台中、彰化、南投': '台中・彰化・南投',
    '嘉義、台南、高雄、屏東': '南台湾',
    '花東地區': '東部'
  },
  ko: {
    '台北市、新北市': '타이베이・신베이',
    '桃園地區': '타오위안',
    '新竹、苗栗': '신주・먀오리',
    '台中、彰化、南投': '타이중・장화・난터우',
    '嘉義、台南、高雄、屏東': '남대만',
    '花東地區': '동부'
  }
}

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

// Replace dash or empty with localized empty
const formatPrice = (p) => {
  if (!p || p === '-') return t.value.noData
  return p
}

const parseRemarks = (text) => {
  if (!text || text === '-') return []
  return text
    .split('。')
    .map(s => s.trim())
    .filter(Boolean)
}

const highlightMoney = (text) => {
  if (!text) return ''
  const regex = /(^|[^0-9/:\-~])(\d{3,})(?=[^0-9/:\-~人位組桌球年月日]|$)/g
  return text.replace(regex, '$1<span class="text-amber-400 font-medium tracking-wide mx-[1px]">$2</span>')
}

const regions = computed(() => [ALL_REGION, ...new Set(golfDataJson.map(c => c.region))])
const regionCounts = { [ALL_REGION]: golfDataJson.length }
golfDataJson.forEach(c => { regionCounts[c.region] = (regionCounts[c.region] || 0) + 1 })

const searchQuery = ref('')
const sortBy = ref('default')

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
const expandedRemarks = reactive(new Set())
const clampedRemarks = reactive(new Set())

function checkOverflow(el, name) {
  if (!el) return
  const isClamped = el.scrollHeight > el.clientHeight + 2
  isClamped ? clampedRemarks.add(name) : clampedRemarks.delete(name)
}
const showInstallGuide = ref(false)
const showAbout = ref(false)
const aboutTab = ref('features')
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

function reloadPage() {
  location.reload()
}

let versionCheckInFlight = false
const VERSION_FETCH_TIMEOUT_MS = 10_000
async function checkVersion() {
  if (import.meta.env.DEV || !currentVersion || versionCheckInFlight) return
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

const filteredCourses = computed(() => {
  const search = searchQuery.value.trim().toLowerCase()
  const list = regionCourses.value.filter(c => {
    if (search && !c.name.toLowerCase().includes(search) && !getCourseName(c).toLowerCase().includes(search)) return false
    if (showFavoritesOnly.value && !isFavorite(c.name)) return false
    if (selectedGolfDay.value !== ALL_GOLF_DAY && c.golfDay !== selectedGolfDay.value) return false
    return true
  })
  let sorted
  if (sortBy.value === 'guestWk')       sorted = [...list].sort((a, b) => parseNum(a.guestWeekday) - parseNum(b.guestWeekday))
  else if (sortBy.value === 'guestHol') sorted = [...list].sort((a, b) => parseNum(a.guestHoliday) - parseNum(b.guestHoliday))
  else if (sortBy.value === 'member')   sorted = [...list].sort((a, b) => parseNum(a.member) - parseNum(b.member))
  else                                  sorted = list
  return sorted.map(c => ({ ...c, parsedRemarks: parseRemarks(c.remarks) }))
})

const showFilterPanel = ref(false)

const filterVisible = ref(true)
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

const onRegionChange = async () => {
  const slug = REGION_TO_SLUG[selectedRegion.value]
  if (slug) await router.push(`/region/${slug}`)
  else await router.push('/')
  await nextTick()
  const el = document.getElementById('content-layer')
  if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}

const activeFilterCount = computed(() => {
  let count = 0
  if (sortBy.value !== 'default') count++
  if (selectedGolfDay.value !== ALL_GOLF_DAY) count++
  return count
})

const getMapUrl = (name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' 高爾夫')}`

const scrollToContent = () => {
  document.getElementById('content-layer').scrollIntoView({ behavior: 'smooth' })
}

let versionTimer = null
let midnightTimer = null
function scheduleMidnight() {
  const now = new Date()
  const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
  midnightTimer = setTimeout(() => { todayDate.value = new Date(); scheduleMidnight() }, ms)
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') checkVersion()
}

onMounted(() => {
  favorites.value = JSON.parse(localStorage.getItem('golffee_favorites') || '[]')
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  desktopMq?.addEventListener('change', onDesktopChange)
  checkVersion()
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
      <button @click="showAbout = true; aboutTab = 'features'"
              class="flex items-center h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border border-white/10 text-white/60 text-xs tracking-wider hover:text-white/90 hover:border-white/25 transition-all">
        {{ t.about }}
      </button>
      <div class="flex items-center gap-2 h-7 sm:h-8 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 border border-white/10 text-xs tracking-wider">
        <Globe class="w-3.5 h-3.5 text-white/70" />
        <select v-model="locale" class="bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-2">
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
        <img src="../assets/hero-bg.png" alt="Golf Course Hero" class="w-full h-full object-cover object-center opacity-70" />
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

        <!-- Filter Controls (Sticky) -->
        <div id="filter-bar" :class="['sticky z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-6 -mx-6 lg:px-12 lg:-mx-12 pt-4 lg:pt-8 pb-3 lg:pb-6 shadow-sm transition-transform duration-300', !filterVisible ? '-translate-y-full lg:translate-y-0' : '']" style="top: env(safe-area-inset-top)">

          <div class="flex flex-col gap-3 md:gap-5 lg:gap-8 lg:flex-row">

            <!-- Row 1: Region + Favorites (Mobile) / Region (Desktop) -->
            <div class="flex items-center gap-3 w-full lg:w-auto lg:flex-1 lg:max-w-xs">
              <div class="flex flex-col gap-1.5 lg:gap-3 flex-1">
                <label class="text-[10px] md:text-xs lg:text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.region }}</label>
                <div class="relative group">
                  <select v-model="selectedRegion" @change="onRegionChange" class="w-full appearance-none bg-transparent border-none pb-1.5 lg:pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                    <option v-for="r in regions" :key="r" :value="r" class="bg-[#1a1a1a] text-white text-base py-2">
                      {{ getRegionName(r) }} ({{ regionCounts[r] }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Mobile only: Favorites -->
              <div class="flex items-end lg:hidden">
                <button @click="showFavoritesOnly = !showFavoritesOnly"
                        :class="['flex items-center gap-1.5 px-3 rounded-full border transition-all duration-200 active:scale-95 h-[38px]',
                                 showFavoritesOnly ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-emerald-400/5 border-emerald-400/40 text-emerald-400']">
                  <Heart :class="['w-4 h-4 transition-transform duration-300', showFavoritesOnly ? 'fill-emerald-400 scale-110' : '']" />
                  <span class="text-[10px] tracking-[0.2em] uppercase font-bold">{{ t.favorites }}</span>
                </button>
              </div>
            </div>

            <!-- Row 2 (Mobile): Search + 篩選 button / Desktop: Search -->
            <div class="flex items-end gap-3 lg:gap-0 flex-1 lg:max-w-xs lg:border-l border-white/10 lg:pl-8">
              <div class="flex flex-col gap-1.5 lg:gap-3 flex-1">
                <label class="text-[10px] md:text-xs lg:text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.search }}</label>
                <div class="relative group flex items-center h-[38px] overflow-hidden">
                  <Search class="w-5 h-5 text-[#888] mr-4 flex-shrink-0 transition-colors group-hover:text-emerald-400" />
                  <input type="text" v-model="searchQuery" :placeholder="t.searchPlaceholder"
                         class="w-full bg-transparent border-none p-0 text-xl lg:text-2xl font-light focus:outline-none focus:ring-0 text-[#f4f4f4] rounded-none placeholder:text-[#333] leading-[38px] flex-1" />
                  <span class="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 group-hover:bg-emerald-500/50 transition-all"></span>
                </div>
              </div>

              <!-- Mobile only: 篩選 button -->
              <div class="flex items-end lg:hidden pb-1.5">
                <button @click="showFilterPanel = !showFilterPanel"
                        :class="['relative flex items-center gap-1.5 px-3 h-[38px] border text-[11px] tracking-widest uppercase transition-all duration-200',
                                 showFilterPanel || activeFilterCount > 0 ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/20 text-[#888]']">
                  <span>篩選</span>
                  <span v-if="activeFilterCount > 0" class="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400 text-black text-[10px] font-bold leading-none">{{ activeFilterCount }}</span>
                  <ChevronDown :class="['w-3 h-3 transition-transform duration-200', showFilterPanel ? 'rotate-180' : '']" />
                </button>
              </div>
            </div>

            <!-- Mobile only: 篩選 Panel -->
            <div v-if="showFilterPanel" class="lg:hidden flex flex-col gap-4 pt-1 pb-2 border-t border-white/10">
              <!-- Golf Day Chips -->
              <div>
                <label class="text-[10px] tracking-[0.1em] text-[#888] uppercase select-none block mb-2">{{ t.golfDay }}</label>
                <div class="flex flex-wrap gap-2">
                  <button @click="selectedGolfDay = ALL_GOLF_DAY"
                          :class="['px-3 py-1.5 text-xs border tracking-wider transition-all duration-150', selectedGolfDay === ALL_GOLF_DAY ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium' : 'border-white/10 text-[#888]']">
                    {{ t.golfDayAll }}
                  </button>
                  <button v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d"
                          @click="selectedGolfDay = selectedGolfDay === d ? ALL_GOLF_DAY : d"
                          :class="['px-3 py-1.5 text-xs border tracking-wider transition-all duration-150',
                                   selectedGolfDay === d ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium' :
                                   d === todayWeekday ? 'border-emerald-400/25 text-[#888] bg-emerald-400/5' : 'border-white/10 text-[#888]']">
                    {{ d }}{{ d === todayWeekday ? ' ★' : '' }}
                  </button>
                </div>
              </div>
              <!-- Sort Chips -->
              <div>
                <label class="text-[10px] tracking-[0.1em] text-[#888] uppercase select-none block mb-2">{{ t.sort }}</label>
                <div class="flex flex-wrap gap-2">
                  <button v-for="(label, val) in { default: t.sortDefault, guestWk: t.sortGuestWk, guestHol: t.sortGuestHol, member: t.sortMember }" :key="val"
                          @click="sortBy = sortBy === val && val !== 'default' ? 'default' : val"
                          :class="['px-3 py-1.5 text-xs border tracking-wider transition-all duration-150', sortBy === val ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium' : 'border-white/10 text-[#888]']">
                    {{ label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop only: Golf Day -->
            <div class="hidden lg:flex flex-col gap-3 w-auto max-w-[120px] border-l border-white/10 pl-8">
              <label class="text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.golfDay }}</label>
              <div class="relative group">
                <select v-model="selectedGolfDay" class="w-full appearance-none bg-transparent border-none pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                  <option :value="ALL_GOLF_DAY" class="bg-[#1a1a1a] text-white text-base">{{ t.golfDayAll }}</option>
                  <option v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d" :value="d" class="bg-[#1a1a1a] text-white text-base">
                    {{ d }}{{ d === todayWeekday ? ' ★' : '' }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Desktop only: Sort -->
            <div class="hidden lg:flex flex-col gap-3 w-auto max-w-[140px] border-l border-white/10 pl-8">
              <label class="text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.sort }}</label>
              <div class="relative group">
                <select v-model="sortBy" class="w-full appearance-none bg-transparent border-none pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                  <option value="default" class="bg-[#1a1a1a] text-white text-base">{{ t.sortDefault }}</option>
                  <option value="guestWk" class="bg-[#1a1a1a] text-white text-base">{{ t.sortGuestWk }}</option>
                  <option value="guestHol" class="bg-[#1a1a1a] text-white text-base">{{ t.sortGuestHol }}</option>
                  <option value="member" class="bg-[#1a1a1a] text-white text-base">{{ t.sortMember }}</option>
                </select>
              </div>
            </div>

            <!-- Desktop only: Favorites Toggle -->
            <div class="hidden lg:flex items-end lg:pb-1">
              <button @click="showFavoritesOnly = !showFavoritesOnly"
                      :class="['flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-200 active:scale-95 h-[40px]',
                               showFavoritesOnly ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-emerald-400/5 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/60']">
                <Heart :class="['w-4 h-4 transition-transform duration-300', showFavoritesOnly ? 'fill-emerald-400 scale-110' : '']" />
                <span class="text-xs tracking-[0.2em] uppercase font-bold">{{ t.favorites }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Table Architecture -->
        <div class="hidden xl:block pt-6">
          <table class="w-full text-left whitespace-nowrap">
            <thead>
              <tr class="text-base uppercase tracking-widest text-[#f4f4f4] font-semibold bg-[#111111] shadow-lg pointer-events-none sticky top-[130px] z-30">
                <th class="py-5 font-semibold w-[16%] px-4 rounded-tl-sm">{{ t.course }}</th>
                <th class="py-5 font-semibold px-4 text-emerald-400">{{ t.guest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.member }}</th>
                <th class="py-5 font-semibold px-4">{{ t.mGuest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.team }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold text-right px-4">{{ t.amenities }}</th>
                <th class="py-5 font-semibold w-[33%] px-4 rounded-tr-sm">{{ t.remarks }}</th>
              </tr>
            </thead>
            <tbody class="text-base font-light">
              <tr v-if="filteredCourses.length === 0">
                <td colspan="7" class="py-24 text-center">
                  <p class="text-white/40 text-base">{{ t.noResult }}</p>
                  <p class="text-white/20 text-sm mt-2">{{ t.noResultSub }}</p>
                </td>
              </tr>
              <tr v-for="c in filteredCourses" :key="c.name" :class="['border-b border-white/[0.08] transition-colors group', c.status === 'closed' ? 'opacity-60 even:bg-[#1a1a1a] odd:bg-[#111111]' : 'even:bg-[#1a1a1a] odd:bg-[#111111] hover:bg-[#262626]']">
                <td class="py-5 px-4 align-top">
                  <div class="flex justify-between items-start pr-2">
                    <div>
                      <div class="flex items-center gap-2 min-w-0">
                        <button @click="toggleFavorite(c.name)" class="focus:outline-none group/fav flex-shrink-0 p-1 -m-1" :aria-label="isFavorite(c.name) ? '取消最愛' : '加入最愛'">
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
                        <span v-if="c.golfDay" :class="['inline-flex items-center gap-1 flex-shrink-0 text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#666] border-white/10']"><GolfFlag :size="12" />{{ c.golfDay }}</span>
                      </div>
                      <div class="mt-2 flex flex-col gap-0.5">
                        <div class="flex items-center gap-2">
                          <div class="text-[#ccc] text-sm tracking-wider uppercase font-normal">{{ getRegionName(c.region) }}</div>
                          <span v-if="c.holes" class="text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                        </div>
                        <div v-if="c.phone" class="text-[#f4f4f4] text-sm flex items-center gap-1.5">
                          <Phone class="w-2.5 h-2.5" />
                          <span>{{ c.phone }}</span>
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

                <td class="py-5 px-4 align-top text-base">
                  <span class="text-[#f4f4f4]">{{ formatPrice(c.guestWeekday) }}</span><span class="text-[#555] px-1 font-mono">/</span><span class="text-[#f4f4f4]">{{ formatPrice(c.guestHoliday) }}</span>
                </td>

                <td class="py-5 px-4 align-top text-[#fff] font-mono text-base">
                  {{ formatPrice(c.member) }}
                </td>

                <td class="py-5 px-4 align-top text-[#eee] text-base">
                  {{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.memberGuestHoliday) }}
                </td>

                <td class="py-5 px-4 align-top text-[#eee] text-base">
                  {{ formatPrice(c.teamWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.teamHoliday) }}
                </td>

                <td class="py-5 px-4 align-top flex justify-end gap-3">
                  <Utensils v-if="c.hasRestaurant" class="w-4 h-4 text-[#f4f4f4]" aria-label="餐廳" role="img" />
                  <Droplets v-if="c.hasWater" class="w-4 h-4 text-[#f4f4f4]" aria-label="飲水" role="img" />
                  <CreditCard v-if="c.hasCard" class="w-4 h-4 text-[#f4f4f4]" aria-label="刷卡" role="img" />
                </td>

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
        </div>

        <!-- Mobile Architecture (Hidden on large screens) -->
        <div class="xl:hidden">
          <div v-if="filteredCourses.length === 0" class="py-24 text-center">
            <p class="text-white/40 text-base">{{ t.noResult }}</p>
            <p class="text-white/20 text-sm mt-2">{{ t.noResultSub }}</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div v-for="c in filteredCourses" :key="c.name" :class="['flex flex-col p-4 md:p-6 border rounded-xl group transition-colors', c.status === 'closed' ? 'bg-[#0a0a0a] opacity-60 border-white/[0.12]' : 'bg-[#0a0a0a] border-white/[0.12] hover:border-white/25']">

            <div class="mb-6 pb-4 border-b border-white/[0.12] flex justify-between items-start">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <button @click="toggleFavorite(c.name)" class="focus:outline-none flex-shrink-0 p-1 -m-1" :aria-label="isFavorite(c.name) ? '取消最愛' : '加入最愛'">
                    <Heart :class="['w-6 h-6 transition-all', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10']" />
                  </button>
                  <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                     :class="locale === 'zh-TW'
                       ? 'text-2xl font-normal tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors'
                       : 'text-xl font-medium tracking-normal text-emerald-400 hover:text-emerald-300 transition-colors'">
                    {{ getCourseName(c) }}
                  </a>
                  <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                     class="flex-shrink-0 text-[#444] hover:text-emerald-400 transition-colors" :aria-label="`${c.name} 官網`">
                    <ExternalLink class="w-4 h-4" />
                  </a>
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-xs text-[#ccc] uppercase tracking-wider font-normal">{{ getRegionName(c.region) }}</p>
                    <span v-if="c.holes" class="text-[10px] md:text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider whitespace-nowrap">{{ c.holes }}H</span>
                    <span v-if="c.golfDay" :class="['inline-flex items-center gap-1 text-[10px] md:text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#888] border-white/10']"><GolfFlag :size="12" />{{ c.golfDay }}</span>
                  </div>
                  <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-2">
                    <Phone class="w-3 h-3" />
                    {{ c.phone }}
                  </p>
                </div>
              </div>
              <div class="text-right mt-1.5 flex flex-col items-end gap-2 flex-shrink-0 ml-3">
                <span v-if="c.status === 'closed'" class="text-[10px] md:text-xs px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">{{ t.closed }}</span>
                <div v-if="c.updateDate && c.status !== 'closed'" class="text-[10px] md:text-xs text-[#FFF] tracking-[0.1em] uppercase flex flex-col items-end font-light">
                  <span>{{ t.update }}</span>
                  <span class="text-[#eee]">{{ c.updateDate }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
              <div>
                <p class="text-xs text-emerald-400 uppercase tracking-wider mb-1">{{ t.guest }}</p>
                <p class="text-sm font-mono font-medium"><span class="text-[#f4f4f4]">{{ formatPrice(c.guestWeekday) }}</span><span class="text-[#555] text-xs px-1">/</span><span class="text-[#f4f4f4]">{{ formatPrice(c.guestHoliday) }}</span></p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.member }}</p>
                <p class="text-base text-white tracking-wide font-mono">{{ formatPrice(c.member) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.mGuest }}</p>
                <p class="text-sm text-[#eee] font-mono">{{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.memberGuestHoliday) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.team }}</p>
                <p class="text-sm text-[#eee] font-mono">{{ formatPrice(c.teamWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.teamHoliday) }}</p>
              </div>
              <div class="col-span-2 flex items-center justify-between">
                <div>
                  <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.amenities }}</p>
                  <div class="flex gap-4 mt-1">
                    <Utensils v-if="c.hasRestaurant" class="w-4 h-4 text-[#f4f4f4]" aria-label="餐廳" role="img" />
                    <Droplets v-if="c.hasWater" class="w-4 h-4 text-[#f4f4f4]" aria-label="飲水" role="img" />
                    <CreditCard v-if="c.hasCard" class="w-4 h-4 text-[#f4f4f4]" aria-label="刷卡" role="img" />
                    <span v-if="!c.hasRestaurant && !c.hasWater && !c.hasCard" class="text-xs text-[#444] tracking-wide">{{ t.noData }}</span>
                  </div>
                </div>
              </div>
            </div>

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

      </div>

      <!-- Region Links -->
      <nav class="px-6 lg:px-12 py-12 lg:py-16 border-t border-white/10 mt-12 lg:mt-16" aria-label="地區專頁">
        <p class="text-[11px] tracking-[0.25em] text-[#555] uppercase mb-6">{{ t.regionNav }}</p>
        <div class="flex flex-wrap gap-3">
          <a v-for="(label, slug) in REGION_NAV_LABELS"
             :key="slug"
             :href="`/region/${slug}`"
             class="px-4 py-2 text-xs border border-white/10 text-[#777] hover:border-emerald-400/40 hover:text-emerald-400 transition-all tracking-wider">
            {{ label }}
          </a>
        </div>
      </nav>

      <!-- Update Banner -->
      <Transition name="update-banner">
        <div v-if="hasUpdate"
             class="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4 py-3 bg-emerald-500 text-black text-sm font-medium"
             style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))">
          <span class="flex items-center gap-2"><Bell class="w-4 h-4 flex-shrink-0" />有新版本，點右側按鈕更新</span>
          <button @click="reloadPage"
                  class="flex-shrink-0 bg-black text-emerald-400 text-sm font-semibold px-4 py-2 rounded-full hover:bg-black/80 transition-colors">
            立即更新
          </button>
        </div>
      </Transition>

      <!-- Persistent Footer -->
      <footer class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md text-center" style="padding-top: 0.5rem; padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));">
        <p class="text-white text-[10px] tracking-[0.25em] font-light opacity-40">
          ©2026 KingsleyZheng · {{ buildDate }}
        </p>
      </footer>
    </div>

    <!-- About Modal -->
    <Transition name="guide">
      <div v-if="showAbout"
           class="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-black/70 backdrop-blur-sm"
           @click.self="showAbout = false">
        <div class="guide-panel w-full max-w-md lg:max-w-lg bg-[#0d0d0d] border-t lg:border border-white/10 rounded-t-2xl lg:rounded-2xl pb-10 overflow-y-auto"
             :style="isDesktop ? { maxHeight: '80vh' } : { height: isStandalone ? 'calc(92vh - env(safe-area-inset-top))' : '95vh' }">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
            <h2 class="text-white text-base font-medium tracking-wide">關於 Golffee</h2>
            <button @click="showAbout = false" class="text-white/40 hover:text-white transition-colors p-1" aria-label="關閉">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-white/10">
            <button @click="aboutTab = 'features'"
                    :class="['flex-1 py-3 text-sm tracking-wide transition-colors', aboutTab === 'features' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/70']">
              功能介紹
            </button>
            <button @click="aboutTab = 'changelog'"
                    :class="['flex-1 py-3 text-sm tracking-wide transition-colors', aboutTab === 'changelog' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-white/40 hover:text-white/70']">
              更新紀錄
            </button>
          </div>

          <!-- Features Tab -->
          <div v-if="aboutTab === 'features'" class="px-6 pt-5 pb-4 flex flex-col gap-6">
            <div v-for="section in features" :key="section.label">
              <div>
                <p class="text-xs tracking-[0.2em] text-white/30 uppercase mb-3">{{ section.label }}</p>
                <ul class="flex flex-col gap-2">
                  <li v-for="f in section.items" :key="f"
                      class="flex items-center gap-2.5 text-sm text-white/70">
                    <span class="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <span v-html="f"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Changelog Tab -->
          <div v-if="aboutTab === 'changelog'" class="px-6 pt-5 pb-4 flex flex-col gap-6">
            <div v-for="release in changelog" :key="release.version">
              <div>
                <p class="text-emerald-400 text-xs font-medium tracking-widest mb-2">{{ release.version }}</p>
                <ul class="flex flex-col gap-1.5">
                  <li v-for="item in release.items" :key="item"
                      class="flex items-start gap-2.5 text-sm text-white/60">
                    <span class="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2"></span>
                    <span v-html="item"></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Install Guide Modal -->
    <Transition name="guide">
      <div v-if="showInstallGuide"
           class="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm"
           @click.self="showInstallGuide = false">
        <div class="guide-panel w-full max-w-md bg-[#0d0d0d] border-t border-white/10 rounded-t-2xl pb-10 overflow-y-auto"
             :style="{ maxHeight: isStandalone ? 'calc(92vh - env(safe-area-inset-top))' : '88vh' }">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
            <div>
              <h2 class="text-white text-base font-medium tracking-wide">加入主畫面</h2>
              <p class="text-white/40 text-sm mt-0.5 tracking-wide">將此網頁安裝為 App</p>
            </div>
            <button @click="showInstallGuide = false" class="text-white/40 hover:text-white transition-colors p-1" aria-label="關閉">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Steps -->
          <div class="px-6 pt-5 flex flex-col gap-8">

            <!-- Step 1 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-sm font-medium">1</div>
              <div class="flex-1">
                <p class="text-white text-base font-medium mb-1">使用 Safari 開啟網頁</p>
                <p class="text-white/50 text-sm leading-relaxed mb-3">確認你使用的是 iPhone 內建的 Safari 瀏覽器，點選底部中間的 ⬆ 分享按鈕</p>
                <img src="/guide-step1.jpg" class="w-full rounded-xl border border-white/10" alt="Safari 分享按鈕示意" />
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-sm font-medium">2</div>
              <div class="flex-1">
                <p class="text-white text-base font-medium mb-1">選擇「加入主畫面」</p>
                <p class="text-white/50 text-sm leading-relaxed mb-3">在分享選單中找到「加入主畫面」並點選</p>
                <img src="/guide-step2.jpg" class="w-full rounded-xl border border-white/10" alt="加入主畫面選項示意" />
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-sm font-medium">3</div>
              <div class="flex-1">
                <p class="text-white text-base font-medium mb-1">點選右上角「加入」</p>
                <p class="text-white/50 text-sm leading-relaxed mb-3">確認名稱後點選加入，完成安裝</p>
                <img src="/guide-step3.jpg" class="w-full rounded-xl border border-white/10" alt="確認加入主畫面示意" />
              </div>
            </div>

            <!-- Done note -->
            <div class="flex items-center gap-3 bg-emerald-400/5 border border-emerald-400/20 rounded-xl px-4 py-3 mb-2">
              <span class="text-xl">✅</span>
              <p class="text-white/70 text-sm leading-relaxed">完成後桌面會出現 App 圖示，下次直接點開就是全螢幕體驗！</p>
            </div>

          </div>
        </div>
      </div>
    </Transition>

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
  opacity: 0.5;
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
.guide-enter-active,
.guide-leave-active {
  transition: opacity 0.25s ease;
}
.guide-enter-active .guide-panel,
.guide-leave-active .guide-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.guide-enter-from,
.guide-leave-to {
  opacity: 0;
}
.guide-enter-from .guide-panel,
.guide-leave-to .guide-panel {
  transform: translateY(100%);
}
@media (min-width: 1024px) {
  .guide-enter-from .guide-panel,
  .guide-leave-to .guide-panel {
    transform: translateY(12px) scale(0.97);
    opacity: 0;
  }
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
