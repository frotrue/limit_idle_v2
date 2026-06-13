<template>
  <Transition name="fade">
    <div v-if="visible" class="alert-overlay" @click.self="cancel">
      <div class="alert-card">
        <div class="alert-header">
          <Info :size="20" />
          <span class="alert-title">{{ title || '알림' }}</span>
        </div>
        <div class="alert-body">
          {{ message }}
        </div>
        <div class="alert-footer" :class="{ 'is-confirm': isConfirm }">
          <button v-if="isConfirm" class="alert-btn secondary" @click="cancel">취소</button>
          <button class="alert-btn" @click="confirm">확인</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { Info } from 'lucide-vue-next'

defineProps({
  message: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  visible: {
    type: Boolean,
    default: false
  },
  isConfirm: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 18px;
}

.alert-card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 340px;
  padding: 20px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease-out;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  color: var(--accent);
}

.alert-title {
  font-weight: 700;
  color: var(--text-strong);
  font-size: 1rem;
}

.alert-body {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.alert-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.alert-footer.is-confirm {
  justify-content: space-between;
}

.alert-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 11px 16px;
  border-radius: var(--radius);
  font-weight: 700;
  cursor: pointer;
  flex: 1;
  font-family: inherit;
}

.alert-btn:hover {
  background: var(--accent-strong);
}

.alert-btn.secondary {
  background: var(--surface-3);
  color: var(--text-muted);
}

.alert-btn.secondary:hover {
  color: var(--text-strong);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
