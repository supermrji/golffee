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

const expandedRemarks = reactive({})

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
                <p class="text-xs text-[#ccc] uppercase tracking-wider font-normal">{{ c.region }}</p>
                <span v-if="c.holes" class="text-xs text-[#888] border border-white/10 px-1.5 py-0.5 leading-none tracking-wider whitespace-nowrap">{{ c.holes }}H</span>
                <span v-if="c.golfDay"
                      :class="['inline-flex items-center gap-1 text-xs px-1.5 py-0.5 tracking-wider border whitespace-nowrap',
                               c.golfDay.split(',').map(d => d.trim()).includes(todayWeekday) ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' : 'text-[#888] border-white/10']">
                  <GolfFlag :size="12" />{{ c.golfDay }}
                </span>
              </div>
              <p v-if="c.phone" class="text-xs text-[#f4f4f4] flex items-center gap-2">
                <Phone class="w-3 h-3" />{{ c.phone }}
              </p>
            </div>
          </div>
          <div class="text-right mt-1.5 flex flex-col items-end gap-2 flex-shrink-0 ml-3">
            <span v-if="c.status === 'closed'" class="text-xs px-2 py-1 leading-none tracking-wider bg-red-500/80 text-white whitespace-nowrap font-medium">{{ t.closed }}</span>
            <div v-if="c.updateDate && c.status !== 'closed'" class="text-xs text-[#FFF] tracking-[0.1em] uppercase flex flex-col items-end font-light">
              <span>{{ t.update }}</span><span class="text-[#eee]">{{ c.updateDate }}</span>
            </div>
          </div>
        </div>
        <!-- Prices -->
        <div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
          <div :class="isGroupActive('guestWeekday','guestHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('guestWeekday','guestHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.guest }}</p>
            <p class="text-sm font-mono font-medium">
              <span :class="isActive('guestWeekday') ? 'text-emerald-300' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestWeekday) }}</span>
              <span class="text-[#555] text-xs px-1">/</span>
              <span :class="isActive('guestHoliday') ? 'text-emerald-300' : 'text-[#f4f4f4]'">{{ formatPrice(c.guestHoliday) }}</span>
            </p>
          </div>
          <div :class="isActive('member') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isActive('member') ? 'text-emerald-400' : 'text-[#888]']">{{ t.member }}</p>
            <p :class="['text-base tracking-wide font-mono', isActive('member') ? 'text-emerald-300' : 'text-white']">{{ formatPrice(c.member) }}</p>
          </div>
          <div :class="isGroupActive('memberGuestWeekday','memberGuestHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('memberGuestWeekday','memberGuestHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.mGuest }}</p>
            <p class="text-sm font-mono">
              <span :class="isActive('memberGuestWeekday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.memberGuestWeekday) }}</span>
              <span class="text-[#666] text-xs px-1">/</span>
              <span :class="isActive('memberGuestHoliday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.memberGuestHoliday) }}</span>
            </p>
          </div>
          <div :class="isGroupActive('teamWeekday','teamHoliday') ? 'ring-1 ring-emerald-400/30 rounded-lg p-2 -m-2' : ''">
            <p :class="['text-xs uppercase tracking-wider mb-1', isGroupActive('teamWeekday','teamHoliday') ? 'text-emerald-400' : 'text-[#888]']">{{ t.team }}</p>
            <p class="text-sm font-mono">
              <span :class="isActive('teamWeekday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.teamWeekday) }}</span>
              <span class="text-[#666] text-xs px-1">/</span>
              <span :class="isActive('teamHoliday') ? 'text-emerald-300' : 'text-[#eee]'">{{ formatPrice(c.teamHoliday) }}</span>
            </p>
          </div>
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
            <button v-if="c.parsedRemarks.length > 3"
                    @click="expandedRemarks[c.name] = !expandedRemarks[c.name]"
                    class="px-3 py-1.5 text-xs border border-white/20 bg-white/5 text-[#aaa] hover:border-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all tracking-wide rounded">
              {{ expandedRemarks[c.name] ? t.collapse : t.expand }}
            </button>
          </div>
          <div :class="expandedRemarks[c.name] ? '' : 'line-clamp-5'">
            <ul class="list-disc pl-3 space-y-2 text-sm text-[#f4f4f4] leading-relaxed marker:text-[#444]">
              <li v-for="(rm, idx) in c.parsedRemarks" :key="idx" v-html="highlightMoney(rm)"></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
