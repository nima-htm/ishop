class ThemeService {
  constructor() {
    this.storageKey = 'financial-app-theme';
    this.currentTheme = this.getStoredTheme() || 'light';
    this.applyTheme();
  }

  getStoredTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('Could not access localStorage:', error);
      return null;
    }
  }

  setStoredTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }
 }

  getCurrentTheme() {
    return this.currentTheme;
  }

  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  setTheme(theme) {
    this.currentTheme = theme;
    this.setStoredTheme(theme);
    this.applyTheme();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  applyTheme() {
    const root = document.documentElement;
    
    if (this.currentTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      root.removeAttribute('data-theme');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  initializeTheme() {
    // Check for system preference
    const systemPrefersDark = window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (!this.getStoredTheme()) {
      this.setTheme(systemPrefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!this.getStoredTheme()) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
    }
  }
}

export default new ThemeService();
