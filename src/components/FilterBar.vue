<script setup>
import { Search, Heart, Globe, LayoutList, LayoutGrid, X, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps({
  regionOptions: Array,
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

    <!-- Row 1: Search + View Toggle + mobile Filter button -->
    <div class="flex items-center gap-2">
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

      <button @click="$emit('update:viewMode', viewMode === 'table' ? 'card' : 'table')"
              class="lg:hidden flex items-center justify-center w-10 h-10 flex-shrink-0 border border-white/10 text-[#888] hover:text-white/60 transition-colors">
        <LayoutGrid v-if="viewMode === 'table'" class="w-4 h-4" />
        <LayoutList v-else class="w-4 h-4" />
      </button>

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

    <!-- Row 2 (PC only) -->
    <div class="hidden lg:flex items-center gap-x-4 mt-3 flex-wrap gap-y-2">
      <div class="flex items-center gap-1.5 flex-wrap">
        <button v-for="opt in regionOptions" :key="opt.value"
                @click="$emit('regionChange', opt.value)"
                :class="['px-2.5 py-1 text-xs border tracking-wider transition-all whitespace-nowrap',
                         selectedRegion === opt.value
                           ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10 font-medium'
                           : 'border-white/10 text-[#888] hover:border-white/25']">
          {{ opt.label }}<span class="text-[10px] opacity-50 ml-1">{{ opt.count }}</span>
        </button>
      </div>
      <div class="w-px h-4 bg-white/10 flex-shrink-0"></div>
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
      <button @click="$emit('update:showFavoritesOnly', !showFavoritesOnly)"
              :class="['flex items-center gap-1.5 px-3 py-1 border text-xs tracking-wider transition-all ml-auto flex-shrink-0',
                       showFavoritesOnly ? 'border-emerald-400/60 text-emerald-400 bg-emerald-400/10' : 'border-white/10 text-[#888] hover:border-white/25']">
        <Heart :class="['w-3.5 h-3.5', showFavoritesOnly ? 'fill-emerald-400' : '']" />
        {{ t.favorites }}
      </button>
    </div>
  </div>

  <!-- Mobile Filter Sheet -->
  <Transition name="slide-up">
    <div v-if="showMobileFilter"
         class="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
         @click.self="showMobileFilter = false">
      <div class="w-full bg-[#0d0d0d] border-t border-white/15 rounded-t-2xl px-5 pt-5 pb-10 flex flex-col gap-5 overflow-y-auto"
           style="max-height: 85vh">
        <div class="flex items-center justify-between">
          <span class="text-white text-sm font-medium tracking-wide">{{ t.filterBtn }}</span>
          <div class="flex items-center gap-4">
            <button @click="resetFilters" class="text-[11px] text-[#888] tracking-widest uppercase hover:text-white/60 transition-colors">{{ t.resetFilter }}</button>
            <button @click="showMobileFilter = false" class="text-white/40 hover:text-white transition-colors"><X class="w-5 h-5" /></button>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.region }}</label>
          <select :value="selectedRegion"
                  @change="$emit('regionChange', $event.target.value); showMobileFilter = false"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in regionOptions" :key="opt.value" :value="opt.value">{{ opt.label }} ({{ opt.count }})</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.identity }}</label>
          <select :value="selectedIdentity" @change="$emit('update:selectedIdentity', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in identityOptions" :key="opt.value" :value="opt.value">{{ t[opt.labelKey] }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.day }}</label>
          <select :value="selectedDay" @change="$emit('update:selectedDay', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option v-for="opt in dayOptions" :key="opt.value" :value="opt.value">{{ t[opt.labelKey] }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[10px] tracking-[0.15em] text-[#555] uppercase">{{ t.golfDay }}</label>
          <select :value="selectedGolfDay" @change="$emit('update:selectedGolfDay', $event.target.value)"
                  class="w-full bg-[#1a1a1a] border border-white/10 text-[#f4f4f4] text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-400/50 rounded">
            <option :value="ALL_GOLF_DAY">{{ t.golfDayAll }}</option>
            <option v-for="d in weekdays.slice(1).concat([weekdays[0]])" :key="d" :value="d">{{ d }}{{ d === todayWeekday ? ' ★' : '' }}</option>
          </select>
        </div>
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
