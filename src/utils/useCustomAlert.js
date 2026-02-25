import { ref, reactive } from 'vue'

const alertState = reactive({
  isVisible: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'تأیید',
  cancelText: 'لغو',
  showCancel: false,
  closeOnOverlay: true,
  resolve: null,
  reject: null
})

export function useCustomAlert() {
  const showAlert = (options) => {
    return new Promise((resolve, reject) => {
      alertState.type = options.type || 'info'
      alertState.title = options.title || ''
      alertState.message = options.message || ''
      alertState.confirmText = options.confirmText || 'تأیید'
      alertState.cancelText = options.cancelText || 'لغو'
      alertState.showCancel = options.showCancel || false
      alertState.closeOnOverlay = options.closeOnOverlay !== false
      alertState.isVisible = true
      alertState.resolve = resolve
      alertState.reject = reject
    })
  }

  const hideAlert = () => {
    alertState.isVisible = false
    alertState.resolve = null
    alertState.reject = null
  }

  const confirmAlert = () => {
    if (alertState.resolve) {
      alertState.resolve(true)
    }
    if (!alertState.showCancel) {
      hideAlert()
    }
  }

  const cancelAlert = () => {
    if (alertState.reject) {
      alertState.reject(false)
    }
    hideAlert()
  }

  // Convenience methods for different alert types
  const showSuccess = (message, title = 'موفقیت') => {
    return showAlert({
      type: 'success',
      title,
      message,
      confirmText: 'باشه'
    })
  }

  const showError = (message, title = 'خطا') => {
    return showAlert({
      type: 'error',
      title,
      message,
      confirmText: 'باشه'
    })
  }

  const showWarning = (message, title = 'هشدار') => {
    return showAlert({
      type: 'warning',
      title,
      message,
      confirmText: 'باشه'
    })
  }

  const showInfo = (message, title = 'اطلاعات') => {
    return showAlert({
      type: 'info',
      title,
      message,
      confirmText: 'باشه'
    })
  }

  const showConfirm = (message, title = 'تأیید', confirmText = 'تأیید', cancelText = 'لغو') => {
    return showAlert({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true
    })
  }

  return {
    alertState,
    showAlert,
    hideAlert,
    confirmAlert,
    cancelAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  }
}