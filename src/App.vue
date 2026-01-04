<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import './style.css'
import ThemeService from './services/ThemeService'

const activeTab = ref('dashboard')

onMounted(() => {
  ThemeService.initializeTheme()
})

const toggleDarkMode = () => {
  ThemeService.toggleTheme()
}

const isDarkMode = computed(() => {
  return ThemeService.isDarkTheme()
})
</script>

<template>
  <div id="app" class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1>فروشگاه من</h1>
        <button class="theme-toggle" @click="toggleDarkMode" :title="isDarkMode ? 'Light Mode' : 'Dark Mode'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <nav class="tab-navigation">
      <RouterLink 
        to="/dashboard" 
        class="tab-link"
        :class="{ 'active': activeTab === 'dashboard' }"
        @click="activeTab = 'dashboard'"
      >
        داشبورد
      </RouterLink>
      <RouterLink 
        to="/product-groups" 
        class="tab-link"
        :class="{ 'active': activeTab === 'product-groups' }"
        @click="activeTab = 'product-groups'"
      >
        نوع کالا
      </RouterLink>
      <RouterLink 
        to="/products" 
        class="tab-link"
        :class="{ 'active': activeTab === 'products' }"
        @click="activeTab = 'products'"
      >
        کالاها
      </RouterLink>
      <RouterLink 
        to="/settings" 
        class="tab-link"
        :class="{ 'active': activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        تنظیمات
      </RouterLink>
    </nav>

    <main class="tab-content">
      <RouterView />
    </main>
 </div>
</template>

<style scoped>
h1{
  color: var(--text-primary);
}
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a1a;
  --text-secondary: #6666;
  --border-color: #e1e5e9;
 --accent: #6366f1;
  --accent-light: #e0e7ff;
 --success: #10b981;
  --danger: #ef4444;
  --header-bg: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d;
 --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent: #818cf8;
 --accent-light: #312e81;
  --success: #34d399;
  --danger: #f87171;
  --header-bg: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --shadow: 0 2px 8px rgba(0, 0, 0.3);
}

.app-container {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
 display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
 transition: background-color 0.3s ease, color 0.3s ease;
}

.app-header {
  background: var(--header-bg);
  color: white;
  padding: 1rem;
  box-shadow: var(--shadow);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  width: 44px;
 height: 44px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
 align-items: center;
  justify-content: center;
  padding: 0;
}

.theme-toggle:hover {
  background: rgba(25, 255, 255, 0.3);
  transform: scale(1.05);
}

.tab-navigation {
  display: flex;
  background-color: var(--bg-secondary);
 border-bottom: 1px solid var(--border-color);
  gap: 0;
}

.tab-link {
  flex: 1;
  padding: 1rem;
  text-align: center;
  text-decoration: none;
  color: var(--text-secondary);
 transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
 background-color: var(--bg-secondary);
 font-weight: 500;
}

.tab-link:hover {
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

.tab-link.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background-color: var(--bg-primary);
}

.tab-content {
  flex: 1;
  background-color: var(--bg-primary);
  overflow-y: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.2rem;
  }
  
  .theme-toggle {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
  
  .tab-link {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1rem;
  }
  
  .tab-link {
    padding: 0.65rem 0.25rem;
    font-size: 0.8rem;
 }
}
</style>
