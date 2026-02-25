<script setup>
import { ref, onMounted } from "vue";
import DatabaseService from "../services/DatabaseService";
import { updateDateFormat } from "../utils/dateFormatter";
import "primeicons/primeicons.css";
// Initialize database
onMounted(async () => {
  await DatabaseService.init();
  await loadDateFormat();
  await loadDatabaseStats();
});

// App preferences
const theme = ref("light");
const language = ref("fa");
const notifications = ref(true);
const dateFormat = ref("Shamsi");

// Database stats
const databaseStats = ref({
  transactionCount: 0,
  settingsCount: 0,
});

// Loading states
const isExporting = ref(false);
const isImporting = ref(false);
const importFile = ref(null);

// Load date format setting from database
const loadDateFormat = async () => {
  try {
    const savedFormat = await DatabaseService.getSetting("dateFormat");
    if (savedFormat) {
      dateFormat.value = savedFormat;
    } else {
      // Default to Shamsi
      await DatabaseService.setSetting("dateFormat", "Shamsi");
    }
  } catch (error) {
    console.error("Error loading date format:", error);
  }
};

// Save date format setting to database
const saveDateFormat = async () => {
  try {
    await DatabaseService.setSetting("dateFormat", dateFormat.value);
    // Update the cache in the utility
    updateDateFormat(dateFormat.value);
  } catch (error) {
    console.error("Error saving date format:", error);
  }
};

// Load database statistics
const loadDatabaseStats = async () => {
  try {
    const stats = await DatabaseService.getDatabaseStats();
    databaseStats.value = stats;
  } catch (error) {
    console.error("Error loading database stats:", error);
  }
};

// Export data to JSON file
const exportData = async () => {
  try {
    isExporting.value = true;

    const exportData = await DatabaseService.exportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ishopDB.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("داده‌ها با موفقیت خارج شدند!");
  } catch (error) {
    console.error("Export error:", error);
    alert("خطا در خروج داده‌ها: " + error.message);
  } finally {
    isExporting.value = false;
  }
};

// Import data from JSON file
const handleFileImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "application/json") {
    alert("لطفاً یک فایل JSON معتبر انتخاب کنید");
    return;
  }

  try {
    isImporting.value = true;

    const confirmImport = confirm(
      "آیا مطمئن هستید که می‌خواهید داده‌ها را بازیابی کنید؟ این عملیات داده‌های فعلی را جایگزین می‌کند."
    );
    if (!confirmImport) return;

    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate required fields
    if (
      !importData.transactions ||
      !importData.settings ||
      !importData.version
    ) {
      throw new Error("ساختار فایل وارد شده معتبر نیست");
    }

    await DatabaseService.importData(importData);
    await loadDatabaseStats();

    alert("داده‌ها با موفقیت بازیابی شدند!");
  } catch (error) {
    console.error("Import error:", error);
    alert("خطا در بازیابی داده‌ها: " + error.message);
  } finally {
    isImporting.value = false;
    // Reset file input
    event.target.value = "";
  }
};

// Trigger file selection
const importFileInput = ref(null);

const triggerFileSelect = () => {
  if (importFileInput.value) {
    importFileInput.value.click();
  }
};

// Format numbers for display
const formatNumber = (num) => {
  return new Intl.NumberFormat("fa-IR").format(num);
};
</script>

<template>
  <div class="settings-view">
    <div class="header-section">
      <h2>تنظیمات</h2>
      <router-link to="/dashboard" class="back-to-dashboard">
        ← داشبورد
      </router-link>
    </div>

    <!-- Database Settings Section -->
    <div class="settings-section">
      <h3>تنظیمات پایگاه داده</h3>

      <!-- Export Button -->
      <div class="setting-item">
        <button @click="exportData" :disabled="isExporting" class="export-btn">
          <span v-if="isExporting">در حال صدور...</span>
          <span v-else>
            <i class="pi pi-file-export" style="font-size: 1.2rem"> </i>
            صدور داده‌ها به حافظه داخلی
          </span>
        </button>
      </div>

      <!-- Import Button -->
      <div class="setting-item">
        <input
          type="file"
          ref="importFileInput"
          accept=".json"
          @change="handleFileImport"
          :disabled="isImporting"
          style="display: none"
        />
        <button
          @click="triggerFileSelect"
          :disabled="isImporting"
          class="import-btn"
        >
          <span v-if="isImporting">در حال وارد کردن...</span>
          <span v-else>
            <i class="pi pi-file-import" style="font-size: 1.2rem"> </i>

            وارد کردن داده‌ها از حافظه داخلی
          </span>
        </button>
      </div>
    </div>
    <!-- App Preferences Section -->
    <div class="settings-section">
      <h3>تنظیمات برنامه</h3>

      <div class="setting-item">
        <label for="date_format">قالب تاریخ</label>
        <select id="date_format" v-model="dateFormat" @change="saveDateFormat">
          <option value="Shamsi">شمسی</option>
          <option value="Miladi">میلادی</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a;
  --text-secondary: #666666;
  --border-color: #e1e5e9;
  --accent: #6366f1;
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef4444;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent: #818cf8;
  --accent-light: #312e81;
  --success: #34d39;
  --danger: #f87171;
}

.settings-view {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.settings-view h2 {
  margin: 0 1.5rem 0;
  color: var(--text-primary);
  text-align: center;
  font-size: 1.75rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  align-items: center;
}

.back-to-dashboard {
  background: var(--accent);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-to-dashboard:hover {
  background: var(--accent-light);
  transform: translateY(-2px);
}

.settings-section {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0.1);
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.settings-section h3 {
  margin: 0 0 1.25rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.5rem;
}

.setting-item {
  margin-bottom: 1.25rem;
  width: 100%;
}

.setting-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.setting-item select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.setting-item select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 3px var(--accent-light);
}

.setting-item input[type="checkbox"] {
  margin-right: 0.5rem;
}

.export-btn,
.import-btn,
.clear-btn {
  padding: 0.85rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.import-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.import-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.clear-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.export-btn:disabled,
.import-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.setting-description {
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.import-label {
  display: inline-block;
}

.database-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-card h4 {
  margin: 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stat-card .stat-number {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.icon {
  font-size: 1.2rem;
  line-height: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .settings-view {
    padding: 1rem;
  }

  .settings-view h2 {
    font-size: 1.4rem;
  }

  .settings-section {
    padding: 1rem;
  }

  .database-stats {
    grid-template-columns: 1fr;
  }

  .stat-card .stat-number {
    font-size: 1.25rem;
  }

  .export-btn,
  .import-btn,
  .clear-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .settings-view {
    padding: 0.75rem;
  }

  .settings-section h3 {
    font-size: 1.1rem;
  }

  .setting-item select {
    font-size: 0.9rem;
  }

  .export-btn,
  .import-btn,
  .clear-btn {
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
  }
}
</style>
