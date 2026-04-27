<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import golfDataJson from '../data/golf_courses.json'
import { Utensils, Droplets, CreditCard, Search, Phone, ExternalLink, Heart, ChevronLeft } from 'lucide-vue-next'
import GolfFlag from '../GolfFlag.vue'

const route = useRoute()
const router = useRouter()

const REGIONS = {
  taipei:   { label: '台北市、新北市', h1: '台北、新北高爾夫球場' },
  taoyuan:  { label: '桃園地區',         h1: '桃園高爾夫球場' },
  hsinchu:  { label: '新竹、苗栗',       h1: '新竹、苗栗高爾夫球場' },
  taichung: { label: '台中、彰化、南投', h1: '台中、彰化、南投高爾夫球場' },
  tainan:   { label: '嘉義、台南、高雄、屏東', h1: '南台灣高爾夫球場' },
  hualien:  { label: '花東地區',         h1: '花東高爾夫球場' },
}

const regionId = route.params.id
const regionInfo = REGIONS[regionId]
const allRegionCourses = golfDataJson.filter(c => c.region === regionInfo?.label)

useHead({
  title: `${regionInfo?.h1}收費查詢 - Golffee`,
  htmlAttrs: { lang: 'zh-TW' },
  meta: [
    { name: 'description', content: `${regionInfo?.h1}共 ${allRegionCourses.length} 座球場，快速查詢平日、假日、來賓與會員收費，掌握最新報價不用再打電話。` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `https://golffee.vercel.app/region/${regionId}` },
    { property: 'og:title', content: `${regionInfo?.h1}收費查詢 - Golffee` },
    { property: 'og:description', content: `${regionInfo?.h1}共 ${allRegionCourses.length} 座球場，快速查詢平日、假日、來賓與會員收費。` },
    { property: 'og:image', content: 'https://golffee.vercel.app/og-image.jpg' },
  ],
  link: [
    { rel: 'canonical', href: `https://golffee.vercel.app/region/${regionId}` }
  ],
})

const searchQuery = ref('')
const sortBy = ref('default')

const parseNum = (v) => {
  const n = parseInt(v)
  return isNaN(n) ? Infinity : n
}

const filteredCourses = computed(() => {
  const list = allRegionCourses.filter(c =>
    !searchQuery.value || c.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())
  )
  if (sortBy.value === 'guestWk')  return [...list].sort((a, b) => parseNum(a.guestWeekday) - parseNum(b.guestWeekday))
  if (sortBy.value === 'guestHol') return [...list].sort((a, b) => parseNum(a.guestHoliday) - parseNum(b.guestHoliday))
  if (sortBy.value === 'member')   return [...list].sort((a, b) => parseNum(a.member) - parseNum(b.member))
  return list
})

const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const todayWeekday = weekdays[new Date().getDay()]

const favorites = ref([])
const expandedRemarks = reactive(new Set())
const clampedRemarks = reactive(new Set())

const toggleFavorite = (name) => {
  const idx = favorites.value.indexOf(name)
  if (idx > -1) favorites.value.splice(idx, 1)
  else favorites.value.push(name)
  localStorage.setItem('golffee_favorites', JSON.stringify(favorites.value))
}

const isFavorite = (name) => favorites.value.includes(name)

const formatPrice = (p) => (!p || p === '-') ? '-' : p

const parseRemarks = (text) => {
  if (!text || text === '-') return []
  return text.split(/[。]/).map(s => s.trim()).filter(Boolean)
}

const highlightMoney = (text) => {
  if (!text) return ''
  const regex = /(^|[^0-9/:\-~])(\d{3,})(?=[^0-9/:\-~人位組桌球年月日]|$)/g
  return text.replace(regex, '$1<span class="text-amber-400 font-medium tracking-wide mx-[1px]">$2</span>')
}

function checkOverflow(el, name) {
  if (!el) return
  const isClamped = el.scrollHeight > el.clientHeight + 2
  isClamped ? clampedRemarks.add(name) : clampedRemarks.delete(name)
}

const getMapUrl = (name) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' 高爾夫')}`

onMounted(() => {
  favorites.value = JSON.parse(localStorage.getItem('golffee_favorites') || '[]')
})
</script>

<template>
  <div class="relative flex flex-col min-h-dvh bg-[#050505] text-[#f4f4f4] font-sans selection:bg-emerald-500 selection:text-white">

    <!-- Header -->
    <header class="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/10">
      <div class="w-full max-w-screen-2xl mx-auto px-6 lg:px-12 py-4 flex items-center gap-4">
        <button @click="router.push('/')"
                class="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm tracking-wide flex-shrink-0">
          <ChevronLeft class="w-4 h-4" />
          首頁
        </button>
        <div class="w-px h-5 bg-white/10 flex-shrink-0"></div>
        <h1 class="text-white font-medium tracking-wide text-base truncate">{{ regionInfo?.h1 }}</h1>
        <span class="text-white/30 text-sm flex-shrink-0">{{ allRegionCourses.length }} 座</span>
      </div>
    </header>

    <!-- Filter Bar -->
    <div class="w-full max-w-screen-2xl mx-auto px-6 lg:px-12 pt-6 pb-4 flex flex-wrap items-end gap-4 lg:gap-8 border-b border-white/10">
      <!-- Search -->
      <div class="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-xs">
        <label class="text-[10px] tracking-[0.1em] text-[#888] uppercase select-none">搜尋球場</label>
        <div class="relative flex items-center h-[38px]">
          <Search class="w-4 h-4 text-[#888] mr-3 flex-shrink-0" />
          <input type="text" v-model="searchQuery" placeholder="球場名稱"
                 class="w-full bg-transparent border-none p-0 text-lg font-light focus:outline-none text-[#f4f4f4] placeholder:text-[#333] leading-[38px]" />
          <span class="absolute bottom-0 left-0 w-full h-[1px] bg-white/10"></span>
        </div>
      </div>
      <!-- Sort -->
      <div class="flex flex-col gap-1.5 w-auto">
        <label class="text-[10px] tracking-[0.1em] text-[#888] uppercase select-none">排序</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="(label, val) in { default: '預設', guestWk: '來賓平日 低→高', guestHol: '來賓假日 低→高', member: '會員 低→高' }" :key="val"
                  @click="sortBy = val"
                  :class="['px-3 py-1.5 text-xs border tracking-wider transition-all duration-150', sortBy === val ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium' : 'border-white/10 text-[#888]']">
            {{ label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="w-full max-w-screen-2xl mx-auto px-6 lg:px-12 flex-1" style="padding-bottom: calc(4rem + env(safe-area-inset-bottom))">

      <!-- No result -->
      <div v-if="filteredCourses.length === 0" class="py-24 text-center">
        <p class="text-white/40">找不到符合條件的球場</p>
      </div>

      <!-- Desktop Table -->
      <div class="hidden xl:block pt-6">
        <table class="w-full text-left whitespace-nowrap">
          <thead>
            <tr class="text-base uppercase tracking-widest text-[#f4f4f4] font-semibold bg-[#111111] shadow-lg pointer-events-none sticky top-[65px] z-30">
              <th class="py-5 font-semibold w-[16%] px-4 rounded-tl-sm">球場名稱</th>
              <th class="py-5 font-semibold px-4">來賓 <span class="text-sm lowercase tracking-normal text-[#888] font-normal">(平日/假日)</span></th>
              <th class="py-5 font-semibold px-4">會員</th>
              <th class="py-5 font-semibold px-4">同組 <span class="text-sm lowercase tracking-normal text-[#888] font-normal">(平日/假日)</span></th>
              <th class="py-5 font-semibold px-4">團體 <span class="text-sm lowercase tracking-normal text-[#888] font-normal">(平日/假日)</span></th>
              <th class="py-5 font-semibold text-right px-4">設施</th>
              <th class="py-5 font-semibold w-[33%] px-4 rounded-tr-sm">備註</th>
            </tr>
          </thead>
          <tbody class="text-base font-light">
            <tr v-for="c in filteredCourses" :key="c.name"
                :class="['border-b border-white/[0.08] transition-colors group', c.status === 'closed' ? 'opacity-60 even:bg-[#1a1a1a] odd:bg-[#111111]' : 'even:bg-[#1a1a1a] odd:bg-[#111111] hover:bg-[#262626]']">
              <td class="py-5 px-4 align-top">
                <div class="flex justify-between items-start pr-2">
                  <div>
                    <div class="flex items-center gap-2 min-w-0">
                      <button @click="toggleFavorite(c.name)" class="focus:outline-none group/fav flex-shrink-0 p-1 -m-1" :aria-label="isFavorite(c.name) ? '取消最愛' : '加入最愛'">
                        <Heart :class="['w-4 h-4 transition-all duration-300', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10 group-hover/fav:text-white/40']" />
                      </button>
                      <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                         class="group-hover:text-emerald-300 text-emerald-400 transition-colors text-lg tracking-wide font-medium truncate">
                        {{ c.name }}
                      </a>
                      <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                         class="text-[#444] hover:text-emerald-400 transition-colors flex-shrink-0" :aria-label="`${c.name} 官網`">
                        <ExternalLink class="w-3.5 h-3.5" />
                      </a>
                      <span v-if="c.golfDay" :class="['inline-flex items-center gap-1 flex-shrink-0 text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#666] border-white/10']">
                        <GolfFlag :size="12" />{{ c.golfDay }}
                      </span>
                    </div>
                    <div class="mt-2 flex items-center gap-2">
                      <span v-if="c.holes" class="text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                      <div v-if="c.phone" class="text-[#f4f4f4] text-sm flex items-center gap-1.5">
                        <Phone class="w-2.5 h-2.5" />
                        <span>{{ c.phone }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right ml-4 flex flex-col items-end gap-2">
                    <span v-if="c.status === 'closed'" class="text-xs px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">已停業</span>
                    <div v-if="c.updateDate" class="text-xs text-[#f4f4f4] tracking-[0.1em] uppercase font-light">
                      更新<br/><span class="text-[#eee]">{{ c.updateDate }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="py-5 px-4 align-top text-[#eee]">{{ formatPrice(c.guestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.guestHoliday) }}</td>
              <td class="py-5 px-4 align-top text-[#fff] font-mono">{{ formatPrice(c.member) }}</td>
              <td class="py-5 px-4 align-top text-[#eee]">{{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.memberGuestHoliday) }}</td>
              <td class="py-5 px-4 align-top text-[#eee]">{{ formatPrice(c.teamWeekday) }} <span class="text-[#666] px-1 font-mono">/</span> {{ formatPrice(c.teamHoliday) }}</td>
              <td class="py-5 px-4 align-top flex justify-end gap-3 text-[#999]">
                <Utensils v-if="c.hasRestaurant" class="w-4 h-4" aria-label="餐廳" role="img" />
                <Droplets v-if="c.hasWater" class="w-4 h-4" aria-label="飲水" role="img" />
                <CreditCard v-if="c.hasCard" class="w-4 h-4" aria-label="刷卡" role="img" />
              </td>
              <td class="py-5 px-4 align-top text-[#f4f4f4] whitespace-normal leading-relaxed text-sm">
                <template v-if="parseRemarks(c.remarks).length">
                  <div :class="expandedRemarks.has(c.name) ? '' : 'line-clamp-[5]'">
                    <ul class="list-disc pl-3 space-y-1.5 marker:text-[#444]">
                      <li v-for="(rm, idx) in parseRemarks(c.remarks)" :key="idx" v-html="highlightMoney(rm)"></li>
                    </ul>
                  </div>
                  <button v-if="parseRemarks(c.remarks).length > 2"
                          @click="expandedRemarks.has(c.name) ? expandedRemarks.delete(c.name) : expandedRemarks.add(c.name)"
                          class="mt-3 px-3 py-1.5 text-xs border border-white/20 bg-white/5 text-[#aaa] hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all tracking-wide rounded">
                    {{ expandedRemarks.has(c.name) ? '▲ 收起' : '▼ 展開' }}
                  </button>
                </template>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div v-for="c in filteredCourses" :key="c.name"
             :class="['flex flex-col p-4 md:p-6 border rounded-xl transition-colors', c.status === 'closed' ? 'bg-[#0a0a0a] opacity-60 border-white/[0.12]' : 'bg-[#0a0a0a] border-white/[0.12] hover:border-white/25']">

          <div class="mb-6 pb-4 border-b border-white/[0.12] flex justify-between items-start">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <button @click="toggleFavorite(c.name)" class="focus:outline-none flex-shrink-0 p-1 -m-1" :aria-label="isFavorite(c.name) ? '取消最愛' : '加入最愛'">
                  <Heart :class="['w-6 h-6 transition-all', isFavorite(c.name) ? 'fill-red-500 text-red-500' : 'text-white/10']" />
                </button>
                <a :href="getMapUrl(c.name)" target="_blank" rel="noopener noreferrer"
                   class="text-2xl font-normal tracking-wide text-emerald-400 hover:text-emerald-300 transition-colors">
                  {{ c.name }}
                </a>
                <a v-if="c.website" :href="c.website" target="_blank" rel="noopener noreferrer"
                   class="flex-shrink-0 text-[#444] hover:text-emerald-400 transition-colors" :aria-label="`${c.name} 官網`">
                  <ExternalLink class="w-4 h-4" />
                </a>
              </div>
              <div class="flex items-center gap-2 flex-wrap mt-1">
                <span v-if="c.holes" class="text-[10px] text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider">{{ c.holes }}H</span>
                <span v-if="c.golfDay" :class="['inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 tracking-wider border whitespace-nowrap', c.golfDay === todayWeekday ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#888] border-white/10']">
                  <GolfFlag :size="12" />{{ c.golfDay }}
                </span>
                <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-1.5">
                  <Phone class="w-3 h-3" />{{ c.phone }}
                </p>
              </div>
            </div>
            <div class="text-right mt-1.5 flex flex-col items-end gap-2 flex-shrink-0 ml-3">
              <span v-if="c.status === 'closed'" class="text-[10px] px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">已停業</span>
              <div v-if="c.updateDate && c.status !== 'closed'" class="text-[10px] text-[#FFF] tracking-[0.1em] uppercase flex flex-col items-end font-light">
                <span>更新</span>
                <span class="text-[#eee]">{{ c.updateDate }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
            <div>
              <p class="text-xs text-[#888] uppercase tracking-wider mb-1">來賓</p>
              <p class="text-sm text-[#eee] font-mono">{{ formatPrice(c.guestWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.guestHoliday) }}</p>
            </div>
            <div>
              <p class="text-xs text-[#888] uppercase tracking-wider mb-1">會員</p>
              <p class="text-base text-white tracking-wide font-mono">{{ formatPrice(c.member) }}</p>
            </div>
            <div>
              <p class="text-xs text-[#888] uppercase tracking-wider mb-1">同組</p>
              <p class="text-sm text-[#eee] font-mono">{{ formatPrice(c.memberGuestWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.memberGuestHoliday) }}</p>
            </div>
            <div>
              <p class="text-xs text-[#888] uppercase tracking-wider mb-1">團體</p>
              <p class="text-sm text-[#eee] font-mono">{{ formatPrice(c.teamWeekday) }} <span class="text-[#666] text-xs px-1">/</span> {{ formatPrice(c.teamHoliday) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-[#888] uppercase tracking-wider mb-1">設施</p>
              <div class="flex gap-4 text-[#888] mt-1">
                <Utensils v-if="c.hasRestaurant" class="w-4 h-4" aria-label="餐廳" role="img" />
                <Droplets v-if="c.hasWater" class="w-4 h-4" aria-label="飲水" role="img" />
                <CreditCard v-if="c.hasCard" class="w-4 h-4" aria-label="刷卡" role="img" />
                <span v-if="!c.hasRestaurant && !c.hasWater && !c.hasCard" class="text-xs text-[#444]">-</span>
              </div>
            </div>
          </div>

          <div v-if="parseRemarks(c.remarks).length" class="pt-4 border-t border-white/[0.12]">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs text-[#888] uppercase tracking-wider">備註</p>
              <button v-if="clampedRemarks.has(c.name) || expandedRemarks.has(c.name)"
                      @click="expandedRemarks.has(c.name) ? expandedRemarks.delete(c.name) : expandedRemarks.add(c.name)"
                      class="px-3 py-1.5 text-xs border border-white/20 bg-white/5 text-[#aaa] hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all tracking-wide rounded">
                {{ expandedRemarks.has(c.name) ? '▲ 收起' : '▼ 展開' }}
              </button>
            </div>
            <div :class="expandedRemarks.has(c.name) ? '' : 'line-clamp-[5]'"
                 :ref="el => checkOverflow(el, c.name)">
              <ul class="list-disc pl-3 space-y-2 text-sm text-[#f4f4f4] leading-relaxed marker:text-[#444]">
                <li v-for="(rm, idx) in parseRemarks(c.remarks)" :key="idx" v-html="highlightMoney(rm)"></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 bg-[#050505]/90 backdrop-blur-md text-center py-3" style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))">
      <p class="text-white text-[10px] tracking-[0.25em] font-light opacity-40">©2026 KingsleyZheng · Golffee</p>
    </footer>

  </div>
</template>

<style scoped>
.font-sans {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
</style>
