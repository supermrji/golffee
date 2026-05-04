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
