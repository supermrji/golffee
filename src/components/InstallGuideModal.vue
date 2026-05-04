<script setup>
import { X } from 'lucide-vue-next'

defineProps({ show: Boolean, isStandalone: Boolean })
defineEmits(['close'])

const steps = [
  { title: '使用 Safari 開啟網頁', desc: '確認你使用的是 iPhone 內建的 Safari 瀏覽器，點選底部中間的 ⬆ 分享按鈕', img: '/guide-step1.jpg', alt: 'Safari 分享按鈕示意' },
  { title: '選擇「加入主畫面」', desc: '在分享選單中找到「加入主畫面」並點選', img: '/guide-step2.jpg', alt: '加入主畫面選項示意' },
  { title: '點選右上角「加入」', desc: '確認名稱後點選加入，完成安裝', img: '/guide-step3.jpg', alt: '確認加入主畫面示意' },
]
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

<style scoped>
.guide-enter-active, .guide-leave-active { transition: opacity 0.25s ease; }
.guide-enter-active .guide-panel, .guide-leave-active .guide-panel { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.guide-enter-from, .guide-leave-to { opacity: 0; }
.guide-enter-from .guide-panel, .guide-leave-to .guide-panel { transform: translateY(100%); }
</style>
