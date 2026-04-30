<script setup>
import { useHead } from '@unhead/vue'
import GolfFlag from '../GolfFlag.vue'

useHead({
  title: '找不到頁面 - Golffee',
  htmlAttrs: { lang: 'zh-TW' },
})
</script>

<template>
  <div class="min-h-dvh bg-[#050505] text-[#f4f4f4] font-sans flex flex-col items-center justify-center px-6 overflow-hidden">

    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="w-[600px] h-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center text-center">
      <div class="relative select-none mb-8">
        <p class="text-[9rem] sm:text-[12rem] font-bold leading-none tracking-tighter text-white/[0.08]">404</p>
        <p class="absolute inset-0 flex items-center justify-center text-[9rem] sm:text-[12rem] font-bold leading-none tracking-tighter bg-gradient-to-b from-white/30 to-white/5 bg-clip-text text-transparent">404</p>
      </div>

      <GolfFlag class="w-8 h-8 text-violet-400/60 mb-5" />
      <h1 class="text-xl sm:text-2xl font-medium tracking-wide text-white/90 mb-3">找不到這個頁面</h1>
      <p class="text-white/35 text-sm leading-relaxed mb-10 max-w-[240px]">你輸入的網址可能已失效或不存在</p>

      <a href="/"
         class="inline-flex items-center gap-2 px-8 py-3 border border-emerald-400/40 text-emerald-400 text-sm tracking-widest hover:bg-emerald-400/10 hover:border-emerald-400/70 transition-all duration-300">
        ← 返回首頁
      </a>
    </div>

    <footer class="absolute bottom-0 left-0 right-0 text-center py-3" style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))">
      <p class="text-white text-[10px] tracking-[0.25em] font-light opacity-20">©2026 KingsleyZheng · Golffee</p>
    </footer>
  </div>
</template>
