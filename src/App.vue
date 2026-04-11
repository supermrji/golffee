<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import golfDataJson from './data/golf_courses.json'
import { MapPin, Utensils, Droplets, CreditCard, ChevronDown, Globe, Search, Phone, ExternalLink, Heart } from 'lucide-vue-next'

const locale = ref('zh-TW')

const dict = {
  'zh-TW': {
    title: '全台高爾夫收費指南',
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
    noResultSub: '試試調整篩選條件'
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
    noResultSub: 'Try adjusting your filters'
  }
}

const t = computed(() => dict[locale.value])

const regionMap = {
  '台北市、新北市': 'Taipei / New Taipei',
  '桃園地區': 'Taoyuan',
  '新竹、苗栗': 'Hsinchu / Miaoli',
  '台中、彰化、南投': 'Taichung / Changhua / Nantou',
  '嘉義、台南、高雄、屏東': 'South Taiwan',
  '花東地區': 'East Taiwan'
}

const getRegionName = (r) => {
  if (r === '全部') return t.value.all
  return locale.value === 'en' ? (regionMap[r] || r) : r
}

// Replace dash or empty with localized empty
const formatPrice = (p) => {
  if (!p || p === '-') return t.value.noData
  return p
}

const parseRemarks = (text) => {
  if (!text || text === '-') return []
  // Split by full stop or semicolon as they are common sentence enders
  return text
    .split(/[。]/)
    .map(s => s.trim())
    .filter(Boolean)
}

const highlightMoney = (text) => {
  if (!text) return ''
  // Regex to match monetary amounts: 3+ digits, ignoring dates/quantities/ranges
  const regex = /(^|[^0-9/:\-~])(\d{3,})(?=[^0-9/:\-~人位組桌球年月日]|$)/g
  return text.replace(regex, '$1<span class="text-amber-400 font-medium tracking-wide mx-[1px]">$2</span>')
}

const courses = ref(golfDataJson)
const regions = computed(() => ['全部', ...new Set(golfDataJson.map(c => c.region))])

const selectedRegion = ref('全部')
const searchQuery = ref('')
const sortBy = ref('default')

const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const todayWeekday = weekdays[new Date().getDay()]
const selectedGolfDay = ref('全部')

const parseNum = (v) => {
  const n = parseInt(v)
  return isNaN(n) ? Infinity : n
}

const regionCounts = computed(() => {
  const counts = { '全部': courses.value.length }
  courses.value.forEach(c => {
    counts[c.region] = (counts[c.region] || 0) + 1
  })
  return counts
})

const favorites = ref(JSON.parse(localStorage.getItem('golffee_favorites') || '[]'))
const showFavoritesOnly = ref(false)

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
  const list = courses.value.filter(c => {
    const regionMatch = selectedRegion.value === '全部' || c.region === selectedRegion.value
    const searchMatch = !searchQuery.value || c.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
    const favoriteMatch = !showFavoritesOnly.value || isFavorite(c.name)
    const golfDayMatch = selectedGolfDay.value === '全部' || c.golfDay === selectedGolfDay.value
    return regionMatch && searchMatch && favoriteMatch && golfDayMatch
  })
  if (sortBy.value === 'guestWk')  return [...list].sort((a, b) => parseNum(a.guestWeekday) - parseNum(b.guestWeekday))
  if (sortBy.value === 'guestHol') return [...list].sort((a, b) => parseNum(a.guestHoliday) - parseNum(b.guestHoliday))
  if (sortBy.value === 'member')   return [...list].sort((a, b) => parseNum(a.member) - parseNum(b.member))
  return list
})

const showFilterPanel = ref(false)

const filterVisible = ref(true)
let lastScrollY = 0
let scrollUpAccum = 0
const SHOW_THRESHOLD = 80  // 需要向上捲超過 80px 才顯示 filter

const handleScroll = () => {
  const currentScrollY = window.scrollY
  const contentLayer = document.getElementById('content-layer')
  const filterBar = document.getElementById('filter-bar')
  const contentTop = contentLayer ? contentLayer.offsetTop : window.innerHeight * 0.7
  const filterHeight = filterBar ? filterBar.offsetHeight : 0
  const activationPoint = contentTop + filterHeight

  // 在 threshold 以上永遠顯示
  if (currentScrollY < activationPoint) {
    filterVisible.value = true
    scrollUpAccum = 0
    lastScrollY = currentScrollY
    return
  }

  const delta = currentScrollY - lastScrollY
  lastScrollY = currentScrollY

  if (delta > 0) {
    // 向下捲：立即隱藏，重置累積
    scrollUpAccum = 0
    filterVisible.value = false
  } else {
    // 向上捲：累積距離，超過門檻才顯示
    scrollUpAccum += Math.abs(delta)
    if (scrollUpAccum >= SHOW_THRESHOLD) {
      filterVisible.value = true
    }
  }
}

const onRegionChange = () => {
  const el = document.getElementById('content-layer')
  if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
}

const activeFilterCount = computed(() => {
  let count = 0
  if (sortBy.value !== 'default') count++
  if (selectedGolfDay.value !== '全部') count++
  return count
})

const getMapUrl = (name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' 高爾夫')}`

const scrollToContent = () => {
  document.getElementById('content-layer').scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

</script>

<template>
  <div class="relative flex flex-col min-h-screen bg-[#050505] text-[#f4f4f4] font-sans selection:bg-emerald-500 selection:text-white">
    
    <!-- Top-Right Language Switcher -->
    <div class="absolute top-6 right-6 z-50 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 border border-white/10 text-xs tracking-wider">
      <Globe class="w-3.5 h-3.5 text-white/70" />
      <select v-model="locale" class="bg-transparent text-white focus:outline-none cursor-pointer appearance-none pr-2">
        <option value="zh-TW" class="bg-black text-base">繁體中文</option>
        <option value="en" class="bg-black text-base">English</option>
      </select>
    </div>

    <!-- Hero Section (Compressed to 70vh) -->
    <div class="relative h-[70vh] w-full flex flex-col items-center justify-center pb-12 pt-24">
      
      <!-- Background Image Layer -->
      <div class="absolute inset-0 z-0">
        <img src="./assets/hero-bg.png" alt="Golf Course Hero" class="w-full h-full object-cover object-center opacity-70" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
      </div>

      <!-- Hero Header -->
      <header class="z-10 text-center flex flex-col items-center">
        <h1 class="text-3xl md:text-5xl lg:text-[4.5rem] font-medium tracking-wide text-white drop-shadow-lg px-4" style="letter-spacing: -0.02em;">{{ t.title }}</h1>
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
      <div class="max-w-7xl mx-auto px-6 md:px-12 flex-1 pb-32">
        
        <!-- Filter Controls (Sticky) -->
        <div id="filter-bar" :class="['sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-6 -mx-6 md:px-12 md:-mx-12 pt-4 md:pt-8 pb-3 md:pb-6 shadow-sm transition-transform duration-300', !filterVisible ? '-translate-y-full md:translate-y-0' : '']">
          
          <div class="flex flex-col gap-3 md:gap-8 md:flex-row">

            <!-- Row 1: Region + Favorites (Mobile) / Region (Desktop) -->
            <div class="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xs">
              <div class="flex flex-col gap-1.5 md:gap-3 flex-1">
                <label class="text-[10px] md:text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.region }}</label>
                <div class="relative group">
                  <select v-model="selectedRegion" @change="onRegionChange" class="w-full appearance-none bg-transparent border-none pb-1.5 md:pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                    <option v-for="r in regions" :key="r" :value="r" class="bg-[#1a1a1a] text-white text-base py-2">
                      {{ getRegionName(r) }} ({{ regionCounts[r] }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Mobile only: Favorites -->
              <div class="flex items-end md:hidden">
                <button @click="showFavoritesOnly = !showFavoritesOnly"
                        :class="['flex items-center gap-1.5 px-3 rounded-full border transition-all duration-200 active:scale-95 h-[38px]',
                                 showFavoritesOnly ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-emerald-400/5 border-emerald-400/40 text-emerald-400']">
                  <Heart :class="['w-4 h-4 transition-transform duration-300', showFavoritesOnly ? 'fill-emerald-400 scale-110' : '']" />
                  <span class="text-[10px] tracking-[0.2em] uppercase font-bold">{{ t.favorites }}</span>
                </button>
              </div>
            </div>

            <!-- Row 2 (Mobile): Search + 篩選 button / Desktop: Search -->
            <div class="flex items-end gap-3 md:gap-0 flex-1 md:max-w-xs md:border-l border-white/10 md:pl-8">
              <div class="flex flex-col gap-1.5 md:gap-3 flex-1">
                <label class="text-[10px] md:text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.search }}</label>
                <div class="relative group flex items-center h-[38px] md:h-[40px] overflow-hidden">
                  <Search class="w-5 h-5 text-[#888] mr-4 flex-shrink-0 transition-colors group-hover:text-emerald-400" />
                  <input type="text" v-model="searchQuery" :placeholder="t.search"
                         class="w-full bg-transparent border-none p-0 text-xl md:text-2xl font-light focus:outline-none focus:ring-0 text-[#f4f4f4] rounded-none placeholder:text-[#333] leading-[40px] flex-1" />
                  <span class="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 group-hover:bg-emerald-500/50 transition-all"></span>
                </div>
              </div>

              <!-- Mobile only: 篩選 button -->
              <div class="flex items-end md:hidden pb-1.5">
                <button @click="showFilterPanel = !showFilterPanel"
                        :class="['relative flex items-center gap-1.5 px-3 h-[34px] border text-[11px] tracking-widest uppercase transition-all duration-200',
                                 showFilterPanel || activeFilterCount > 0 ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/20 text-[#888]']">
                  <span>篩選</span>
                  <span v-if="activeFilterCount > 0" class="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400 text-black text-[10px] font-bold leading-none">{{ activeFilterCount }}</span>
                  <ChevronDown :class="['w-3 h-3 transition-transform duration-200', showFilterPanel ? 'rotate-180' : '']" />
                </button>
              </div>
            </div>

            <!-- Mobile only: 篩選 Panel -->
            <div v-if="showFilterPanel" class="md:hidden flex flex-col gap-4 pt-1 pb-2 border-t border-white/10">
              <!-- Golf Day Chips -->
              <div>
                <label class="text-[10px] tracking-[0.1em] text-[#888] uppercase select-none block mb-2">{{ t.golfDay }}</label>
                <div class="flex flex-wrap gap-2">
                  <button @click="selectedGolfDay = '全部'"
                          :class="['px-3 py-1 text-xs border tracking-wider transition-all', selectedGolfDay === '全部' ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-[#666]']">
                    {{ t.golfDayAll }}
                  </button>
                  <button v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d"
                          @click="selectedGolfDay = selectedGolfDay === d ? '全部' : d"
                          :class="['px-3 py-1 text-xs border tracking-wider transition-all',
                                   selectedGolfDay === d ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/10 text-[#666]']">
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
                          :class="['px-3 py-1 text-xs border tracking-wider transition-all', sortBy === val ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-[#666]']">
                    {{ label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Desktop only: Golf Day -->
            <div class="hidden md:flex flex-col gap-3 w-auto max-w-[120px] border-l border-white/10 pl-8">
              <label class="text-sm tracking-[0.1em] text-[#888] uppercase select-none">{{ t.golfDay }}</label>
              <div class="relative group">
                <select v-model="selectedGolfDay" class="w-full appearance-none bg-transparent border-none pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                  <option value="全部" class="bg-[#1a1a1a] text-white text-base">{{ t.golfDayAll }}</option>
                  <option v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d" :value="d" class="bg-[#1a1a1a] text-white text-base">
                    {{ d }}{{ d === todayWeekday ? ' ★' : '' }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Desktop only: Sort -->
            <div class="hidden md:flex flex-col gap-3 w-auto max-w-[140px] border-l border-white/10 pl-8">
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
            <div class="hidden md:flex items-end md:pb-1">
              <button @click="showFavoritesOnly = !showFavoritesOnly" 
                      :class="['flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-200 active:scale-95 h-[40px]', 
                               showFavoritesOnly ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-emerald-400/5 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/60']">
                <Heart :class="['w-4 h-4 transition-transform duration-300', showFavoritesOnly ? 'fill-emerald-400 scale-110' : '']" />
                <span class="text-[10px] tracking-[0.2em] uppercase font-bold">{{ t.favorites }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop Table Architecture -->
        <div class="hidden xl:block">
          <table class="w-full text-left whitespace-nowrap">
            <thead>
              <tr class="text-base uppercase tracking-widest text-[#f4f4f4] font-semibold bg-[#111111] shadow-lg pointer-events-none sticky top-[108px] z-30">
                <th class="py-5 font-semibold w-[20%] px-4 rounded-tl-sm">{{ t.course }}</th>
                <th class="py-5 font-semibold px-4">{{ t.guest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.member }}</th>
                <th class="py-5 font-semibold px-4">{{ t.mGuest }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.team }} <span class="text-sm lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold text-right px-4">{{ t.amenities }}</th>
                <th class="py-5 font-semibold w-[25%] px-4 rounded-tr-sm">{{ t.remarks }}</th>
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
                        <button @click="toggleFavorite(c.name)" class="focus:outline-none group/fav flex-shrink-0" :title="t.favorites">
                          <Heart :class="['w-4 h-4 transition-all duration-300', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10 group-hover/fav:text-white/40']" />
                        </button>
                        <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                           class="group-hover:text-emerald-300 text-emerald-400 transition-colors relative text-lg tracking-wide font-medium truncate min-w-0">
                          {{ c.name }}
                          <span class="absolute -bottom-1 left-0 w-full h-[1px] bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        </a>
                        <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                           class="text-[#444] hover:text-emerald-400 transition-colors flex-shrink-0" title="Website">
                          <ExternalLink class="w-3.5 h-3.5" />
                        </a>
                        <span v-if="c.golfDay" :class="['flex-shrink-0 text-[10px] px-1.5 py-0.5 leading-none tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#666] border-white/10']">⛳ {{ c.golfDay }}</span>
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

                <td class="py-5 px-4 align-top text-[#eee] text-base">
                  {{ formatPrice(c.guestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.guestHoliday) }}
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
                
                <td class="py-5 px-4 align-top flex justify-end gap-3 text-[#999]">
                  <Utensils v-if="c.hasRestaurant" class="w-[15px] h-[15px]" title="Restaurant" />
                  <Droplets v-if="c.hasWater" class="w-[15px] h-[15px]" title="Water" />
                  <CreditCard v-if="c.hasCard" class="w-[15px] h-[15px]" title="Card" />
                </td>
                
                <td class="py-5 px-4 align-top text-[#f4f4f4] whitespace-normal leading-relaxed text-sm">
                  <ul v-if="parseRemarks(c.remarks).length" class="list-disc pl-3 space-y-1.5 marker:text-[#444]">
                    <li v-for="(rm, idx) in parseRemarks(c.remarks)" :key="idx" v-html="highlightMoney(rm)"></li>
                  </ul>
                  <span v-else>{{ t.noData }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Architecture (Hidden on large screens) -->
        <div v-if="filteredCourses.length === 0" class="xl:hidden py-24 text-center">
          <p class="text-white/40 text-base">{{ t.noResult }}</p>
          <p class="text-white/20 text-sm mt-2">{{ t.noResultSub }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 xl:hidden">
          <div v-for="c in filteredCourses" :key="c.name" :class="['p-6 border border-white/[0.05] group', c.status === 'closed' ? 'bg-[#0a0a0a] opacity-60' : 'bg-[#0a0a0a]']">
            
            <div class="mb-6 pb-4 border-b border-white/[0.05] flex justify-between items-start">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <button @click="toggleFavorite(c.name)" class="focus:outline-none flex-shrink-0" :title="t.favorites">
                    <Heart :class="['w-6 h-6 transition-all', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10']" />
                  </button>
                  <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                     class="text-2xl font-light tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors">
                    {{ c.name }}
                  </a>
                  <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                     class="flex-shrink-0 text-[#444] hover:text-emerald-400 transition-colors">
                    <ExternalLink class="w-4 h-4" />
                  </a>
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-xs text-[#ccc] uppercase tracking-wider font-normal">{{ getRegionName(c.region) }}</p>
                    <span v-if="c.holes" class="text-[10px] text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider whitespace-nowrap">{{ c.holes }}H</span>
                    <span v-if="c.golfDay" :class="['text-[10px] px-1.5 py-0.5 leading-none tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#888] border-white/10']">⛳ {{ c.golfDay }}</span>
                  </div>
                  <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-2">
                    <Phone class="w-3 h-3" />
                    {{ c.phone }}
                  </p>
                </div>
              </div>
              <div class="text-right mt-1.5 flex flex-col items-end gap-2 flex-shrink-0 ml-3">
                <span v-if="c.status === 'closed'" class="text-[10px] px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">{{ t.closed }}</span>
                <div v-if="c.updateDate && c.status !== 'closed'" class="text-[10px] text-[#FFF] tracking-[0.1em] uppercase flex flex-col items-end font-light">
                  <span>{{ t.update }}</span>
                  <span class="text-[#eee]">{{ c.updateDate }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.guest }}</p>
                <p class="text-sm text-[#eee]">{{ formatPrice(c.guestWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.guestHoliday) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.member }}</p>
                <p class="text-base text-white tracking-wide">{{ formatPrice(c.member) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.mGuest }}</p>
                <p class="text-sm text-[#eee]">{{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.memberGuestHoliday) }}</p>
              </div>
              <div>
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.team }}</p>
                <p class="text-sm text-[#eee]">{{ formatPrice(c.teamWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.teamHoliday) }}</p>
              </div>
              <div class="col-span-2 flex items-center justify-between">
                <div>
                  <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.amenities }}</p>
                  <div class="flex gap-4 text-[#888] mt-1">
                    <Utensils v-if="c.hasRestaurant" class="w-4 h-4" />
                    <Droplets v-if="c.hasWater" class="w-4 h-4" />
                    <CreditCard v-if="c.hasCard" class="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="parseRemarks(c.remarks).length" class="pt-4 border-t border-white/[0.05]">
              <p class="text-xs text-[#888] uppercase tracking-wider mb-3">{{ t.remarks }}</p>
              <ul class="list-disc pl-3 space-y-2 text-sm text-[#f4f4f4] leading-relaxed marker:text-[#444]">
                <li v-for="(rm, idx) in parseRemarks(c.remarks)" :key="idx" v-html="highlightMoney(rm)"></li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      <!-- Persistent Footer -->
      <footer class="relative z-30 py-16 border-t border-white/5 bg-[#050505] text-center">
        <p class="text-white text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-light opacity-50">
          © 2026 KingsleyZheng. All Rights Reserved.
        </p>
        <p class="text-white/50 text-[9px] tracking-[0.2em] font-light mt-2">v 2026.4.11</p>
      </footer>
    </div>

  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
</style>
