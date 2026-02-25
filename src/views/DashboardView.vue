<script setup>
import { ref, onMounted, computed, watch } from "vue";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Pie, Bar } from "vue-chartjs";
import DatabaseService from "../services/DatabaseService";
import { formatNumber } from "chart.js/helpers";

import "primeicons/primeicons.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// Data service using IndexedDB
const DataService = {
  async getProducts() {
    try {
      return await DatabaseService.getProducts();
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  },

  async getProductGroups() {
    try {
      return await DatabaseService.getProductGroups();
    } catch (error) {
      console.error("Error getting product groups:", error);
      return [];
    }
  },

  async getProductsByGroup() {
    const products = await this.getProducts();
    const groups = await this.getProductGroups();
    const groupMap = {};

    // Create a map of group codes to group names
    const groupCodeMap = {};
    groups.forEach((group) => {
      groupCodeMap[group.product_group_code] = group.group_name;
    });

    // Count products by group
    products.forEach((product) => {
      const groupName =
        groupCodeMap[product.product_group_code] || product.product_group_code;
      groupMap[groupName] = (groupMap[groupName] || 0) + 1;
    });

    return groupMap;
  },

  async getProductSummary() {
    const products = await this.getProducts();
    const summary = {
      totalProducts: products.length,
      totalQuantity: 0,
      totalValue: 0,
      entranceProducts: 0,
      departureProducts: 0,
    };

    products.forEach((product) => {
      summary.totalQuantity += product.quantity || 0;
      summary.totalValue +=
        (product.quantity || 0) * (product.cost_per_product || 0);
      if (product.is_entrance) {
        summary.entranceProducts += 1;
      } else {
        summary.departureProducts += 1;
      }
    });

    return summary;
  },
};

const productsByGroup = ref({});
const productSummary = ref({});

onMounted(async () => {
  await DatabaseService.init();
  await updateData();
});

const updateData = async () => {
  productsByGroup.value = await DataService.getProductsByGroup();
  productSummary.value = await DataService.getProductSummary();
};

// Chart data
const pieChartData = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#966FF",
        "#FF9F40",
      ],
    },
  ],
});

const barChartData = ref({
  labels: [],
  datasets: [
    {
      label: "تعداد کالاها",
      data: [],
      backgroundColor: "#6366f1",
    },
  ],
});

// Update chart data when data changes
const updateChartData = () => {
  // Pie chart data (products by group)
  const groups = Object.keys(productsByGroup.value);
  const counts = Object.values(productsByGroup.value);

  pieChartData.value = {
    labels: groups,
    datasets: [
      {
        data: counts,
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  // Bar chart data (summary statistics)
  const labels = ["کالاهای ورودی", "کالاهای خروجی", "کل کالاها"];
  const data = [
    productSummary.value.entranceProducts,
    productSummary.value.departureProducts,
    productSummary.value.totalProducts,
  ];

  barChartData.value = {
    labels: labels,
    datasets: [
      {
        label: "تعداد",
        data: data,
        backgroundColor: ["#10b981", "#ef4444", "#6366f1"],
      },
    ],
  };
};

// Update chart when data changes
watch(
  [productsByGroup, productSummary],
  () => {
    updateChartData();
  },
  { deep: true }
);
</script>

<template>
  <div class="dashboard">
    <!-- Category Cards -->
    <div class="categories-grid">
      <!-- Product Management Category -->
      <div class="category-card product-category">
        <div class="category-icon">
          <i class="pi pi-box"></i>
        </div>
        <h3>انبار کالا</h3>
        <p>مدیریت کالاها و دسته بندی آن ها</p>
        <div class="category-buttons">
          <router-link to="/products" class="category-button">
            تعریف کالا
          </router-link>
          <router-link to="/product-groups" class="category-button">
            تعریف نوع کالا
          </router-link>
        </div>
      </div>

      <!-- Entrance Management Category -->
      <div class="category-card entrance-category">
        <div class="category-icon">
          <i class="pi pi-sign-in"></i>
        </div>
        <h3>ورود کالا</h3>
        <p>ثبت و مدیریت فاکتور ورودی کالا</p>
        <div class="category-buttons">
          <router-link to="/entrance" class="category-button">
            ورود کالا
          </router-link>
        </div>
      </div>

      <!-- Settings Category -->
      <div class="category-card settings-category">
        <div class="category-icon">
          <i class="pi pi-cog"></i>
        </div>
        <h3>تنظیمات</h3>
        <p>تنظیمات سیستم و گرفتن نسخه پشتیبان</p>
        <div class="category-buttons">
          <router-link to="/settings" class="category-button">
            تنظیمات
          </router-link>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts">
      <div class="chart-container">
        <h3>تعداد کالاها بر اساس گروه</h3>
        <div class="chart-content">
          <Pie
            :data="pieChartData"
            :options="{ responsive: true, maintainAspectRatio: false }"
            v-if="pieChartData.labels.length > 0"
          />
          <div v-else class="no-data">هیچ داده ای وجود ندارد</div>
        </div>
      </div>

      <div class="chart-container">
        <h3>خلاصه کالاها</h3>
        <div class="chart-content">
          <Bar
            :data="barChartData"
            :options="{ responsive: true, maintainAspectRatio: false }"
            v-if="barChartData.labels.length > 0"
          />
          <div v-else class="no-data">هیچ داده ای وجود ندارد</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a1a;
  --text-secondary: #221616;
  --border-color: #424a53;
  --accent: #6366f1;
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef4444;
  --product-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --entrance-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --settings-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
  --product-gradient: linear-gradient(135deg, #059669 0%, #047857 100%);
  --entrance-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --settings-gradient: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.dashboard {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard h2 {
  color: var(--text-primary);
  margin: 0 0 2rem 0;
  font-size: 1.75rem;
  text-align: center;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.category-card {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 16px;
  text-decoration: none;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: none;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.category-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.category-card.product-category {
  background: var(--product-gradient);
}

.category-card.entrance-category {
  background: var(--entrance-gradient);
}

.category-card.settings-category {
  background: var(--settings-gradient);
}

.category-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  z-index: 2;
}

.category-icon i {
  display: block;
}

.category-card h3 {
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  z-index: 2;
}

.category-card p {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
  z-index: 2;
}

.category-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1rem;
  z-index: 2;
}

.category-button {
  display: inline-block;
  padding: 0.75rem 1.25rem;
  background: rgba(67, 140, 168, 0.637);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border: 2px solid var(--border-color);
  backdrop-filter: blur(10px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.category-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Ensure buttons are visible in both light and dark modes */
[data-theme="dark"] .category-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(25, 255, 255, 0.2);
}
.pi {
  color: var(--text-primary);
}
.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.chart-container {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0.1);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chart-container h3 {
  margin: 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.chart-content {
  height: 300px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard h2 {
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
  }

  .categories-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .category-card {
    padding: 1.5rem;
  }

  .category-icon {
    font-size: 2.5rem;
  }

  .category-card h3 {
    font-size: 1.1rem;
  }

  .category-card p {
    font-size: 0.8rem;
  }

  .charts {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .chart-container {
    padding: 1rem;
  }

  .chart-container h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }

  .chart-content {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.75rem;
  }

  .dashboard h2 {
    font-size: 1.2rem;
  }

  .category-card {
    padding: 1.25rem;
  }

  .category-icon {
    font-size: 2rem;
  }

  .category-card h3 {
    font-size: 1rem;
  }

  .category-card p {
    font-size: 0.75rem;
  }

  .category-arrow {
    font-size: 1.2rem;
  }

  .chart-content {
    height: 200px;
  }
}
</style>
