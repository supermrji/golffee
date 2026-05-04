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
const isColActive = (...fields) => fields.includes(props.priceField)
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
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('guestWeekday') ? 'text-emerald-300 font-medium' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestWeekday) }}</span>
          <span class="text-[#555] px-1 font-mono">/</span>
          <span :class="isCellActive('guestHoliday') ? 'text-emerald-300 font-medium' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestHoliday) }}</span>
        </td>
        <td :class="['py-5 px-4 align-top font-mono text-base', isCellActive('member') ? 'text-emerald-300 font-medium' : 'text-[#fff]']">
          {{ formatPrice(c.member) }}
        </td>
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('memberGuestWeekday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.memberGuestWeekday) }}</span>
          <span class="text-[#666] px-1 font-mono">/</span>
          <span :class="isCellActive('memberGuestHoliday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.memberGuestHoliday) }}</span>
        </td>
        <td class="py-5 px-4 align-top text-base">
          <span :class="isCellActive('teamWeekday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.teamWeekday) }}</span>
          <span class="text-[#666] px-1 font-mono">/</span>
          <span :class="isCellActive('teamHoliday') ? 'text-emerald-300 font-medium' : 'text-[#eee]'">{{ formatPrice(c.teamHoliday) }}</span>
        </td>
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
