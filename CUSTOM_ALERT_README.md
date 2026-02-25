# Custom Alert System

This project now uses a custom alert system instead of browser's default `alert()` and `confirm()` dialogs. The custom alerts are more visually appealing, support different types (success, error, warning, info, confirm), and provide better user experience.

## Features

- **Multiple Alert Types**: Success, Error, Warning, Info, and Confirm dialogs
- **Responsive Design**: Works well on mobile and desktop
- **Dark Mode Support**: Automatically adapts to the app's theme
- **Accessibility**: Proper focus management and keyboard navigation
- **Promise-based API**: Easy to use with async/await

## Usage

### Basic Usage

```javascript
import { useCustomAlert } from '../utils/useCustomAlert.js'

const { showSuccess, showError, showWarning, showInfo, showConfirm } = useCustomAlert()

// Show success message
await showSuccess('Operation completed successfully!')

// Show error message
await showError('Something went wrong!')

// Show warning
await showWarning('Please check your input')

// Show info
await showInfo('Here is some information')

// Show confirmation dialog
const confirmed = await showConfirm('Are you sure?', 'Confirm Action', 'Yes', 'No')
if (confirmed) {
  // User clicked Yes
}
```

### Advanced Usage

```javascript
const { showAlert } = useCustomAlert()

// Custom alert with full control
const result = await showAlert({
  type: 'confirm',
  title: 'Delete Item',
  message: 'This action cannot be undone. Are you sure?',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  showCancel: true,
  closeOnOverlay: false
})
```

## Alert Types

- **success**: Green alert with checkmark icon
- **error**: Red alert with error icon
- **warning**: Orange alert with warning icon
- **info**: Blue alert with info icon
- **confirm**: Purple alert with question icon

## API Reference

### useCustomAlert()

Returns an object with the following methods:

#### showSuccess(message, title?)
Shows a success alert.

#### showError(message, title?)
Shows an error alert.

#### showWarning(message, title?)
Shows a warning alert.

#### showInfo(message, title?)
Shows an info alert.

#### showConfirm(message, title?, confirmText?, cancelText?)
Shows a confirmation dialog that returns a Promise<boolean>.

#### showAlert(options)
Shows a custom alert with full control over all options.

### Options Object

```javascript
{
  type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: '', // Optional title
  message: '', // Required message
  confirmText: 'تأیید', // Confirm button text
  cancelText: 'لغو', // Cancel button text
  showCancel: false, // Whether to show cancel button
  closeOnOverlay: true // Whether clicking overlay closes the alert
}
```

## Implementation Details

- **Global Component**: The `CustomAlert` component is mounted globally in `App.vue`
- **Teleport**: Uses Vue's `<Teleport>` to render alerts at the body level
- **Reactive State**: Uses a reactive state object managed by the composable
- **Transitions**: Smooth fade-in/fade-out animations
- **Z-index**: High z-index (1000) to appear above other content

## Migration from Browser Alerts

Replace all `alert()` calls with appropriate custom alert methods:

```javascript
// Old
alert('Success!')

// New
await showSuccess('Success!')
```

Replace `confirm()` calls:

```javascript
// Old
if (confirm('Are you sure?')) {
  // do something
}

// New
const confirmed = await showConfirm('Are you sure?')
if (confirmed) {
  // do something
}
```

## Files Updated

The following files have been updated to use the custom alert system:

- ✅ **EntranceView.vue** - Success/error messages and confirm dialogs for clearing history
- ✅ **ProductView.vue** - Product save/update messages and delete confirmations
- ✅ **ProductGroupView.vue** - Group save/update messages and delete confirmations
- ✅ **SettingsView.vue** - Import/export messages, file validation, and import confirmations