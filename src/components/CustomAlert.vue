<template>
  <Transition name="fade">
    <div v-if="visible" class="alert-overlay" @click.self="cancel">
      <div class="alert-card">
        <div class="alert-header">
          <span class="alert-icon">🔔</span>
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
<!--sas-->
<script setup>
const props = defineProps({
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
  emit('close')
}

const cancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.alert-card {
  background: #1a1a1e;
  border: 1px solid #2a2a2e;
  border-radius: 20px;
  width: 90%;
  max-width: 340px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease-out;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-title {
  font-weight: bold;
  color: #5e81ac;
  font-size: 1.1rem;
}

.alert-body {
  color: #eee;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 24px;
  white-space: pre-wrap;
  text-align: center;
}

.alert-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.alert-footer.is-confirm {
  justify-content: space-between;
}

.alert-btn {
  background: #5e81ac;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  font-family: inherit;
}

.alert-btn:hover {
  background: #81a1c1;
  transform: translateY(-2px);
}

.alert-btn.secondary {
  background: #2a2a2e;
  color: #888;
}

.alert-btn.secondary:hover {
  background: #3b4252;
  color: #fff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
