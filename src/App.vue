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
    holes: '洞數'
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
    holes: 'Holes'
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
  return courses.value.filter(c => {
    const regionMatch = selectedRegion.value === '全部' || c.region === selectedRegion.value
    const searchMatch = !searchQuery.value || c.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
    const favoriteMatch = !showFavoritesOnly.value || isFavorite(c.name)
    return regionMatch && searchMatch && favoriteMatch
  })
})

const getMapUrl = (name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' 高爾夫')}`

const scrollToContent = () => {
  document.getElementById('content-layer').scrollIntoView({ behavior: 'smooth' })
}

</script>

<template>
  <div class="relative min-h-[100vh] bg-[#050505] text-[#f4f4f4] font-sans selection:bg-emerald-500 selection:text-white">
    
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
    <div id="content-layer" class="relative z-20 min-h-[100vh] -mt-24 pt-0 pb-32 bg-[#050505] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
      <div class="max-w-7xl mx-auto px-6 md:px-12">
        
        <!-- Filter Controls (Sticky) -->
        <div class="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 px-6 -mx-6 md:px-12 md:-mx-12 pt-4 md:pt-8 pb-3 md:pb-6 shadow-sm overflow-hidden">
          
          <div class="flex flex-col gap-3 md:gap-8 md:flex-row">
            
            <!-- Row 1 (Mobile): Region + Favorites -->
            <div class="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xs">
              <div class="flex flex-col gap-1.5 md:gap-3 flex-1">
                <label class="text-[10px] md:text-xs tracking-[0.1em] text-[#888] uppercase select-none">{{ t.region }}</label>
                <div class="relative group">
                  <select v-model="selectedRegion" class="w-full appearance-none bg-transparent border-none pb-1.5 md:pb-2 text-lg focus:outline-none focus:ring-0 text-[#f4f4f4] cursor-pointer rounded-none border-b border-transparent hover:border-white/20 transition-all font-light">
                    <option v-for="r in regions" :key="r" :value="r" class="bg-[#1a1a1a] text-white text-base py-2">
                      {{ getRegionName(r) }} ({{ regionCounts[r] }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Favorites Toggle (Mobile: Next to Region, Desktop: End of row) -->
              <div class="flex items-end md:hidden">
                <button @click="showFavoritesOnly = !showFavoritesOnly" 
                        :class="['flex items-center justify-center rounded-full border transition-all duration-200 active:scale-95 h-[38px] w-[38px]', 
                                 showFavoritesOnly ? 'bg-emerald-400/20 border-emerald-400/60 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-emerald-400/5 border-emerald-400/40 text-emerald-400']">
                  <Heart :class="['w-4 h-4 transition-transform duration-300', showFavoritesOnly ? 'fill-emerald-400 scale-110' : '']" />
                </button>
              </div>
            </div>

            <!-- Row 2 (Mobile): Search -->
            <div class="flex flex-col gap-1.5 md:gap-3 flex-1 md:max-w-xs md:border-l border-white/10 md:pl-8">
              <label class="text-[10px] md:text-xs tracking-[0.1em] text-[#888] uppercase select-none">{{ t.search }}</label>
              <div class="relative group flex items-center h-[38px] md:h-[40px] overflow-hidden">
                <Search class="w-5 h-5 text-[#888] mr-4 flex-shrink-0 transition-colors group-hover:text-emerald-400" />
                <input type="text" v-model="searchQuery" :placeholder="t.search" 
                       class="w-full bg-transparent border-none p-0 text-xl md:text-2xl font-light focus:outline-none focus:ring-0 text-[#f4f4f4] rounded-none placeholder:text-[#333] leading-[40px] flex-1" />
                <span class="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 group-hover:bg-emerald-500/50 transition-all"></span>
              </div>
            </div>

            <!-- Row 1 (Desktop): Favorites Toggle at the end -->
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
        <div class="hidden lg:block">
          <table class="w-full text-left whitespace-nowrap">
            <thead>
              <tr class="text-sm uppercase tracking-widest text-[#f4f4f4] font-semibold bg-[#111111] shadow-lg pointer-events-none sticky top-[108px] z-30">
                <th class="py-5 font-semibold w-[20%] px-4 rounded-tl-sm">{{ t.course }}</th>
                <th class="py-5 font-semibold px-4">{{ t.guest }} <span class="text-xs lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.member }}</th>
                <th class="py-5 font-semibold px-4">{{ t.mGuest }} <span class="text-xs lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold px-4">{{ t.team }} <span class="text-xs lowercase tracking-normal text-[#888] font-normal">({{ t.weekday }}/{{ t.holiday }})</span></th>
                <th class="py-5 font-semibold text-right px-4">{{ t.amenities }}</th>
                <th class="py-5 font-semibold w-[25%] px-4 rounded-tr-sm">{{ t.remarks }}</th>
              </tr>
            </thead>
            <tbody class="text-sm font-light">
              <tr v-for="c in filteredCourses" :key="c.name" class="border-b border-white/[0.08] even:bg-[#1a1a1a] odd:bg-[#111111] hover:bg-[#262626] transition-colors group">
                <td class="py-5 px-4 align-top">
                  <div class="flex justify-between items-start pr-2">
                    <div>
                      <div class="flex items-center gap-3">
                        <button @click="toggleFavorite(c.name)" class="focus:outline-none group/fav" :title="t.favorites">
                          <Heart :class="['w-4 h-4 transition-all duration-300', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10 group-hover/fav:text-white/40']" />
                        </button>
                        <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer" 
                           class="group-hover:text-emerald-300 text-emerald-400 transition-colors inline-block relative text-base tracking-wide font-medium">
                          {{ c.name }}
                          <span class="absolute -bottom-1 left-0 w-full h-[1px] bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        </a>
                        <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer" 
                           class="text-[#444] hover:text-emerald-400 transition-colors" title="Website">
                          <ExternalLink class="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div class="mt-2 flex flex-col gap-0.5">
                        <div class="flex items-center gap-2">
                          <div class="text-[#ccc] text-[11px] tracking-wider uppercase font-normal">{{ getRegionName(c.region) }}</div>
                          <span v-if="c.holes" class="text-[10px] text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                        </div>
                        <div v-if="c.phone" class="text-[#f4f4f4] text-[11px] flex items-center gap-1.5">
                          <Phone class="w-2.5 h-2.5" />
                          <span>{{ c.phone }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="c.updateDate" class="text-[10px] text-[#f4f4f4] tracking-[0.1em] uppercase text-right ml-4 font-light">
                      {{ t.update }}<br/><span class="text-[#eee]">{{ c.updateDate }}</span>
                    </div>
                  </div>
                </td>
                
                <td class="py-5 px-4 align-top text-[#eee]">
                  {{ formatPrice(c.guestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.guestHoliday) }}
                </td>
                
                <td class="py-5 px-4 align-top text-[#fff] font-mono">
                  {{ formatPrice(c.member) }}
                </td>
                
                <td class="py-5 px-4 align-top text-[#eee]">
                  {{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.memberGuestHoliday) }}
                </td>
                
                <td class="py-5 px-4 align-top text-[#eee]">
                  {{ formatPrice(c.teamWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.teamHoliday) }}
                </td>
                
                <td class="py-5 px-4 align-top flex justify-end gap-3 text-[#999]">
                  <Utensils v-if="c.hasRestaurant" class="w-[15px] h-[15px]" title="Restaurant" />
                  <Droplets v-if="c.hasWater" class="w-[15px] h-[15px]" title="Water" />
                  <CreditCard v-if="c.hasCard" class="w-[15px] h-[15px]" title="Card" />
                </td>
                
                <td class="py-5 px-4 align-top text-[#f4f4f4] whitespace-normal leading-relaxed text-xs">
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:hidden">
          <div v-for="c in filteredCourses" :key="c.name" class="p-6 bg-[#0a0a0a] border border-white/[0.05] group">
            
            <div class="mb-6 pb-4 border-b border-white/[0.05] flex justify-between items-start">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-4">
                    <button @click="toggleFavorite(c.name)" class="focus:outline-none" :title="t.favorites">
                      <Heart :class="['w-6 h-6 transition-all', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10']" />
                    </button>
                    <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer" 
                       class="block text-2xl font-light tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors">
                      {{ c.name }}
                    </a>
                  </div>
                  <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer" 
                     class="bg-white/5 p-2 rounded-full text-[#666] hover:text-emerald-400 transition-colors">
                    <ExternalLink class="w-4 h-4" />
                  </a>
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-[#ccc] uppercase tracking-wider font-normal">{{ getRegionName(c.region) }}</p>
                    <span v-if="c.holes" class="text-[10px] text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                  </div>
                  <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-2">
                    <Phone class="w-3 h-3" />
                    {{ c.phone }}
                  </p>
                </div>
              </div>
              <div v-if="c.updateDate" class="text-[10px] text-[#FFF] tracking-[0.1em] uppercase text-right mt-1.5 flex flex-col items-end font-light">
                <span >{{ t.update }}</span>
                <span class="text-[#eee]">{{ c.updateDate }}</span>
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
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.team }}</p>
                <p class="text-sm text-[#eee]">{{ formatPrice(c.teamWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.teamHoliday) }}</p>
              </div>
              <div class="col-span-1">
                <p class="text-xs text-[#888] uppercase tracking-wider mb-1">{{ t.amenities }}</p>
                <div class="flex gap-4 text-[#888] mt-1">
                  <Utensils v-if="c.hasRestaurant" class="w-4 h-4" />
                  <Droplets v-if="c.hasWater" class="w-4 h-4" />
                  <CreditCard v-if="c.hasCard" class="w-4 h-4" />
                </div>
              </div>
            </div>

            <div v-if="parseRemarks(c.remarks).length" class="pt-4 border-t border-white/[0.05]">
              <p class="text-xs text-[#888] uppercase tracking-wider mb-3">{{ t.remarks }}</p>
              <ul class="list-disc pl-3 space-y-2 text-xs text-[#f4f4f4] leading-relaxed marker:text-[#444]">
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
