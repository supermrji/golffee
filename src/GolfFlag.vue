<template>
  <svg :width="size" :height="size" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- green mound -->
    <ellipse cx="8" cy="14" rx="6" ry="2" fill="#16a34a" opacity="0.85"/>
    <!-- pole -->
    <line x1="6" y1="2" x2="6" y2="14" stroke="#6b7280" stroke-width="1.2" stroke-linecap="round"/>
    <!-- flag -->
    <path d="M6 2 L13 4.5 L6 7.5 Z" fill="#ef4444"/>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 12 }
})
</script>
