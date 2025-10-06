<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
            'animate-in slide-in-from-right',
            variantClasses[toast.variant]
          ]"
        >
          <component
            :is="getIcon(toast.variant)"
            :class="['w-5 h-5 flex-shrink-0 mt-0.5', iconClasses[toast.variant]]"
          />
          
          <div class="flex-1 min-w-0">
            <h4 v-if="toast.title" class="font-semibold text-sm text-foreground mb-1">
              {{ toast.title }}
            </h4>
            <p class="text-sm text-muted-foreground">
              {{ toast.message }}
            </p>
          </div>
          
          <button
            @click="removeToast(toast.id)"
            class="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { CheckCircle, AlertTriangle, Info, X as XCircle, X } from 'lucide-vue-next'

const toasts = ref([])

const variantClasses = {
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-orange-500/10 border-orange-500/20',
  info: 'bg-blue-500/10 border-blue-500/20'
}

const iconClasses = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-orange-500',
  info: 'text-blue-500'
}

function getIcon(variant) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }
  return icons[variant] || Info
}

function addToast({ title, message, variant = 'info', duration = 5000 }) {
  const id = Date.now()
  toasts.value.push({ id, title, message, variant })
  
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
  
  return id
}

function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ addToast, removeToast })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
