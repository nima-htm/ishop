<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'
import DatabaseService from '../services/DatabaseService'
import { formatNumber } from 'chart.js/helpers'

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Data service using IndexedDB
const DataService = {
  async getProducts() {
    try {
      return await DatabaseService.getProducts()
    } catch (error) {
      console.error('Error getting products:', error)
      return []
    }
  },
  
  async getProductGroups() {
    try {
      return await DatabaseService.getProductGroups()
    } catch (error) {
      console.error('Error getting product groups:', error)
      return []
    }
  },
  
  async getProductsByGroup() {
    const products = await this.getProducts()
    const groups = await this.getProductGroups()
    const groupMap = {}
    
    // Create a map of group codes to group names
    const groupCodeMap = {}
    groups.forEach(group => {
      groupCodeMap[group.product_group_code] = group.group_name
    })
    
    // Count products by group
    products.forEach(product => {
      const groupName = groupCodeMap[product.product_group_code] || product.product_group_code
      groupMap[groupName] = (groupMap[groupName] || 0) + 1
    })
    
    return groupMap
  },
  
  async getProductSummary() {
    const products = await this.getProducts()
    const summary = {
      totalProducts: products.length,
      totalQuantity: 0,
      totalValue: 0,
      entranceProducts: 0,
      departureProducts: 0
    }
    
    products.forEach(product => {
      summary.totalQuantity += product.quantity || 0
      summary.totalValue += (product.quantity || 0) * (product.cost_per_product || 0)
      if (product.is_entrance) {
        summary.entranceProducts += 1
      } else {
        summary.departureProducts += 1
      }
    })
    
    return summary
  }
}

const productsByGroup = ref({})
const productSummary = ref({})
const products = ref([])

onMounted(async () => {
  await DatabaseService.init()
  await updateData()
})

const updateData = async () => {
  productsByGroup.value = await DataService.getProductsByGroup()
  productSummary.value = await DataService.getProductSummary()
  const allProducts = await DataService.getProducts()
 // Sort by date added (newest first)
  products.value = allProducts.slice(-5).reverse()
}

// Chart data
const pieChartData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#966FF',
      '#FF9F40'
    ]
  }]
})

const barChartData = ref({
  labels: [],
  datasets: [
    {
      label: 'تعداد کالاها',
      data: [],
      backgroundColor: '#6366f1'
    }
  ]
})

// Update chart data when data changes
const updateChartData = () => {
  // Pie chart data (products by group)
  const groups = Object.keys(productsByGroup.value)
  const counts = Object.values(productsByGroup.value)
  
  pieChartData.value = {
    labels: groups,
    datasets: [{
      data: counts,
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#966FF',
        '#FF9F40'
      ]
    }]
  }

  // Bar chart data (summary statistics)
  const labels = ['کالاهای ورودی', 'کالاهای خروجی', 'کل کالاها']
  const data = [
    productSummary.value.entranceProducts,
    productSummary.value.departureProducts,
    productSummary.value.totalProducts
  ]
  
  barChartData.value = {
    labels: labels,
    datasets: [
      {
        label: 'تعداد',
        data: data,
        backgroundColor: ['#10b981', '#ef4444', '#6366f1']
      }
    ]
  }
}

// Summary data
const totalProducts = ref(0)
const totalQuantity = ref(0)
const totalValue = ref(0)

const updateSummary = async () => {
  const summary = await DataService.getProductSummary()
  totalProducts.value = summary.totalProducts
  totalQuantity.value = summary.totalQuantity
  totalValue.value = summary.totalValue
}

// Update summary and chart when data changes
watch([productsByGroup, productSummary], async () => {
  await updateSummary()
  updateChartData()
}, { deep: true })
</script>

<template>
 <div class="dashboard">
    <div class="summary-cards">
      <div class="card income">
        <h3>تعداد کالاها</h3>
        <p class="amount">{{ formatNumber(totalProducts) }}</p>
      </div>
      <div class="card expense">
        <h3>تعداد کل</h3>
        <p class="amount">{{ formatNumber(totalQuantity) }}</p>
      </div>
      <div class="card balance">
        <h3>ارزش کل (تومان)</h3>
        <p class="amount">{{ formatNumber(totalValue) }}</p>
      </div>
    </div>

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

    <div class="recent-products">
      <h3>کالاهای اخیر</h3>
      <div class="table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th>کد کالا</th>
              <th>نام کالا</th>
              <th>گروه</th>
              <th>نوع</th>
              <th>تعداد</th>
              <th>قیمت واحد</th>
              <th>مبلغ کل</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.product_code }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.product_group_code }}</td>
              <td>
                <span class="type-badge" :class="product.is_entrance ? 'entrance' : 'departure'">
                  {{ product.is_entrance ? 'ورودی' : 'خروجی' }}
                </span>
              </td>
              <td class="number-cell">{{ product.quantity }}</td>
              <td class="amount-cell">{{ formatNumber(product.cost_per_product) }}</td>
              <td class="amount">{{ formatNumber(product.total_cost) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="products.length === 0" class="no-data">
          داده ای یافت نشد
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .card h3 {
  color: var(--text-primary);
}
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-color: #e1e5e9;
  --accent: #6366f1;
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef4444;
  --card-income: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --card-expense: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  --card-balance: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent: #818cf8;
  --accent-light: #312e81;
  --success: #34d399;
  --danger: #f87171;
  --card-income: linear-gradient(135deg, #059669 0%, #047857 100%);
  --card-expense: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  --card-balance: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

.dashboard {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard h2 {
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  color: white;
  padding: 1.75rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.card.balance {
  background: var(--card-balance);
}

.card.income {
  background: var(--card-income);
}

.card.expense {
  background: var(--card-expense);
}

.card h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  opacity: 0.95;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card .amount {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chart-container h3 {
  margin: 0 0 1rem 0;
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

.recent-products {
  background: var(--bg-secondary);
  padding: 1.5rem;
 border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.recent-products h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.products-table th {
  background: var(--accent-light);
  font-weight: 700;
  color: var(--accent);
}

.products-table tbody tr:hover {
  background: var(--bg-primary);
}

.type-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.type-badge.income {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.type-badge.expense {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.amount.income {
  color: var(--success);
  font-weight: 700;
}

.amount.expense {
  color: var(--danger);
  font-weight: 700;
}

/* Responsive design */
@media (max-width: 768px) {
 .dashboard {
    padding: 1rem;
  }

  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

 .card {
    padding: 1.25rem;
  }

 .card h3 {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .card .amount {
    font-size: 1.5rem;
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

  .products-table {
    font-size: 0.9rem;
 }

  .products-table th,
  .products-table td {
    padding: 0.75rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.75rem;
 }

  .dashboard h2 {
    font-size: 1.3rem;
 }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 1rem;
 }

  .card h3 {
    font-size: 0.8rem;
 }

  .card .amount {
    font-size: 1.3rem;
 }

  .chart-container {
    min-height: auto;
    padding: 0.75rem;
  }

  .chart-container h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
 }

  .chart-content {
    height: 200px;
  }

  .products-table {
    font-size: 0.8rem;
  }

  .products-table th,
  .products-table td {
    padding: 0.5rem 0.35rem;
  }

  .type-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>
