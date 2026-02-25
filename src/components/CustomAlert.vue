<template>
  <Teleport to="body">
    <Transition name="alert-fade">
      <div
        v-if="isVisible"
        class="custom-alert-overlay"
        @click="closeOnOverlay"
      >
        <div class="custom-alert" :class="alertType" @click.stop>
          <div class="alert-header">
            <div class="alert-icon">
              <i :class="iconClass"></i>
            </div>
            <button class="alert-close" @click="close">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="alert-content">
            <h3 class="alert-title">{{ title }}</h3>
            <p class="alert-message">{{ message }}</p>
          </div>
          <div class="alert-actions">
            <button
              v-if="showCancel"
              class="alert-btn cancel-btn"
              @click="cancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="alert-btn confirm-btn"
              @click="confirm"
              :class="{ danger: isDanger }"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["success", "error", "warning", "info", "confirm"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: "تأیید",
  },
  cancelText: {
    type: String,
    default: "لغو",
  },
  showCancel: {
    type: Boolean,
    default: false,
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const isVisible = ref(false);

const alertType = computed(() => `alert-${props.type}`);
const isDanger = computed(
  () => props.type === "error" || props.type === "warning",
);

const iconClass = computed(() => {
  const icons = {
    success: "pi pi-check-circle",
    error: "pi pi-times-circle",
    warning: "pi pi-exclamation-triangle",
    info: "pi pi-info-circle",
    confirm: "pi pi-question-circle",
  };
  return icons[props.type] || "pi pi-info-circle";
});

const close = () => {
  isVisible.value = false;
  emit("update:modelValue", false);
};

const confirm = () => {
  emit("confirm");
  if (!props.showCancel) {
    close();
  }
};

const cancel = () => {
  emit("cancel");
  close();
};

const closeOnOverlay = () => {
  if (props.closeOnOverlay) {
    close();
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    isVisible.value = newValue;
  },
);
</script>

<style scoped>
.custom-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.custom-alert {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.3s ease;
}

.custom-alert.alert-success {
  border-left: 4px solid #10b981;
}

.custom-alert.alert-error {
  border-left: 4px solid #ef4444;
}

.custom-alert.alert-warning {
  border-left: 4px solid #f59e0b;
}

.custom-alert.alert-info {
  border-left: 4px solid #3b82f6;
}

.custom-alert.alert-confirm {
  border-left: 4px solid #8b5cf6;
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem 0.5rem;
}

.alert-icon {
  font-size: 2rem;
}

.alert-icon i {
  color: var(--text-primary);
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.alert-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.alert-content {
  padding: 0 1.5rem 1rem;
}

.alert-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-message {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.95rem;
}

.alert-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.5rem;
}

.alert-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: #e1e5e9;
}

.confirm-btn {
  background: var(--accent);
  color: white;
}

.confirm-btn:hover {
  background: var(--accent-light);
  transform: translateY(-1px);
}

.confirm-btn.danger {
  background: var(--danger);
}

.confirm-btn.danger:hover {
  background: #dc2626;
}

/* Animations */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
}

.alert-fade-enter-active .custom-alert,
.alert-fade-leave-active .custom-alert {
  transition: transform 0.3s ease;
}

.alert-fade-enter-from .custom-alert,
.alert-fade-leave-to .custom-alert {
  transform: scale(0.8);
}

/* Dark theme adjustments */
[data-theme="dark"] .cancel-btn:hover {
  background: #404040;
}

/* Responsive */
@media (max-width: 480px) {
  .custom-alert {
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .alert-actions {
    flex-direction: column;
  }

  .alert-btn {
    width: 100%;
  }
}
</style>
