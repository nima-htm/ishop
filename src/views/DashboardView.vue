<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Pie, Bar } from 'vue-chartjs'
import DatabaseService from '../services/DatabaseService'
import { formatNumber } from 'chart.js/helpers'
import { formatDate as formatDateUtil } from '../utils/dateFormatter'

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

// Data service using IndexedDB
const DataService = {
  async getTransactions() {
    try {
      return await DatabaseService.getTransactions()
    } catch (error) {
      console.error('Error getting transactions:', error)
      return []
    }
 },
  
  async getExpensesByCategory() {
    const transactions = await this.getTransactions()
    const categories = {}
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        categories[transaction.category] = (categories[transaction.category] || 0) + transaction.finalAmount
      }
    })
    
    return categories
  },
  
  async getMonthlySummary() {
    const transactions = await this.getTransactions()
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 }
      }
      
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.finalAmount
      } else {
        monthlyData[month].expenses += transaction.finalAmount
      }
    })
    
    return monthlyData
  }
}

const expensesByCategory = ref({})
const monthlySummary = ref({})
const recentTransactions = ref([])

onMounted(async () => {
  await DatabaseService.init()
  await updateData()
})

const updateData = async () => {
  expensesByCategory.value = await DataService.getExpensesByCategory()
  monthlySummary.value = await DataService.getMonthlySummary()
  const allTransactions = await DataService.getTransactions()
  // Format dates when loading
  recentTransactions.value = await Promise.all(
    allTransactions.slice(-5).reverse().map(async (transaction) => ({
      ...transaction,
      formattedDate: await formatDateUtil(transaction.date, 'YYYY-MM-DD')
    }))
  )
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
      label: 'درآمد',
      data: [],
      backgroundColor: '#4CAF50'
    },
    {
      label: 'هزینه',
      data: [],
      backgroundColor: '#F44336'
    }
  ]
})

// Update chart data when data changes
const updateChartData = () => {
 // Pie chart data
  const categories = Object.keys(expensesByCategory.value)
  const amounts = Object.values(expensesByCategory.value)
  
  pieChartData.value = {
    labels: categories,
    datasets: [{
      data: amounts,
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

  // Bar chart data
  const months = Object.keys(monthlySummary.value)
  const incomeData = months.map(month => monthlySummary.value[month].income)
  const expenseData = months.map(month => monthlySummary.value[month].expenses)
  
  barChartData.value = {
    labels: months,
    datasets: [
      {
        label: 'درآمد',
        data: incomeData,
        backgroundColor: '#4CAF50'
      },
      {
        label: 'هزینه',
        data: expenseData,
        backgroundColor: '#F44336'
      }
    ]
 }
}

// Summary data
const totalIncome = ref(0)
const totalExpenses = ref(0)
const balance = ref(0)

const updateSummary = async () => {
  const transactions = await DataService.getTransactions()
  totalIncome.value = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.finalAmount, 0)
  totalExpenses.value = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.finalAmount, 0)
  balance.value = totalIncome.value - totalExpenses.value
}

// Update summary and chart when data changes
watch([expensesByCategory, monthlySummary], async () => {
  await updateSummary()
  updateChartData()
}, { deep: true })
</script>

<template>
  <div class="dashboard">
    <div class="summary-cards">
      <div class="card">
        <h3>مجموع درآمد</h3>
        <p class="amount income">{{ formatNumber(totalIncome) }} تومان</p>
      </div>
      <div class="card">
        <h3>مجموع هزینه ها</h3>
        <p class="amount expense">{{ formatNumber(totalExpenses) }} تومان</p>
      </div>
      <div class="card">
        <h3>موجودی فعلی</h3>
        <p class="amount" :class="balance >= 0 ? 'income' : 'expense'">{{formatNumber(balance) }} تومان</p>
      </div>
    </div>

    <div class="charts">
      <div class="chart-container">
        <h3>هزینه ها بر اساس دسته بندی</h3>
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
        <h3>گزارش ماهانه</h3>
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

    <div class="recent-transactions">
      <h3>تراکنش های اخیر</h3>
      <div class="table-container">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>عنوان</th>
              <th>دسته بندی</th>
              <th>هزینه یا درآمد</th>
              <th>مبلغ نهایی (تومان)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in recentTransactions" :key="transaction.id">
              <td>{{transaction.formattedDate }}</td>
              <td>{{ transaction.description }}</td>
              <td>{{ transaction.category }}</td>
              <td>
                <span class="type-badge" :class="transaction.type">
                                  {{ transaction.type === 'expense' ? 'هزینه' : 'درامد' }}

                </span>
              </td>
              <td class="amount" :class="transaction.type">
                {{ formatNumber(transaction.finalAmount) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="recentTransactions.length === 0" class="no-data">
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

.recent-transactions {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.recent-transactions h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.transactions-table th {
  background: var(--accent-light);
  font-weight: 700;
  color: var(--accent);
}

.transactions-table tbody tr:hover {
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

  .transactions-table {
    font-size: 0.9rem;
 }

  .transactions-table th,
  .transactions-table td {
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

  .transactions-table {
    font-size: 0.8rem;
  }

  .transactions-table th,
  .transactions-table td {
    padding: 0.5rem 0.35rem;
  }

  .type-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>
