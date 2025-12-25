<script setup>
import { ref, onMounted } from 'vue'
import DatabaseService from '../services/DatabaseService'
import { formatNumber } from 'chart.js/helpers'
// Initialize database
onMounted(async () => {
  await DatabaseService.init()
  await loadTransactions()
})

// Data service using IndexedDB
const DataService = {
  async getTransactions() {
    try {
      return await DatabaseService.getTransactions()
    } catch (error) {
      console.error('خطا در بارگزاری:', error)
      return []
    }
 },
  
  async deleteTransaction(id) {
    try {
      await DatabaseService.deleteTransaction(id)
      return await this.getTransactions()
    } catch (error) {
      console.error('خطا در حذف تراکنش:', error)
      return []
    }
  }
}

const transactions = ref([])

const loadTransactions = async () => {
  const allTransactions = await DataService.getTransactions()
  transactions.value = allTransactions.reverse()
}

const deleteTransaction = async (id) => {
  await DataService.deleteTransaction(id)
  await loadTransactions()
}



// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="transactions-view">
    <h2>همه تراکنش ها</h2>
    
    <div class="table-container">
      <table class="transactions-table">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th class="th-section">عنوان</th>
            <th>دسته بندی</th>
            <th>نوع هزینه</th>
            <th>(تومان) مقدار </th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in transactions" :key="transaction.id">
            <td>{{ formatDate(transaction.date) }}</td>
            <td>{{ transaction.description }}</td>
            <td>{{ transaction.category }}</td>
            <td>
              <span class="type-badge" :class="transaction.type">
                {{ transaction.type }}
              </span>
            </td>
            <td class="amount" :class="transaction.type">
              {{ formatNumber(transaction.amount) }}
            </td>
            <td>
              <button 
                @click="deleteTransaction(transaction.id)"
                class="delete-btn"
              >
                حذف
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="transactions.length === 0" class="no-data">
        داده ای یافت نشد
      </div>
    </div>
  </div>
</template>

<style scoped>
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
}

.transactions-view {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.transactions-view h2 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  text-align: center;
  font-size: 1.75rem;
}

.table-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
  border: 1px solid var(--border-color);
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  direction: rtl;
}

.transactions-table th,
.transactions-table td {
  padding: 1rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.transactions-table th {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-weight: 500;
  position: sticky;
  top: 0;
}

.transactions-table tbody tr {
  transition: all 0.2s ease;
}

.transactions-table tbody tr:hover {
  background: var(--bg-primary);
}

.transactions-table tbody tr:last-child td {
  border-bottom: none;
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

.amount {
  font-weight: 700;
  font-size: 1rem;
}

.amount.income {
  color: var(--success);
}

.amount.expense {
  color: var(--danger);
}

.delete-btn {
  background: var(--danger);
  color: white;
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.delete-btn:active {
  transform: scale(0.95);
}

.no-data {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  font-style: italic;
  font-size: 1.05rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .transactions-view {
    padding: 1rem;
  }

  .transactions-view h2 {
    font-size: 1.4rem;
  }

  .transactions-table th,
  .transactions-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
        text-align: center;
  }

  .delete-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .transactions-view {
    padding: 0.75rem;
  }

  .transactions-view h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .transactions-table {
    font-size: 0.85rem;
    text-align: center;
  }

  .transactions-table th,
  .transactions-table td {
    padding: 0.6rem 0.4rem;
  }

  .transactions-table th {
    font-size: 0.75rem;
        text-align: center;
  }

  .type-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }

  .amount {
    font-size: 0.9rem;
  }

  .delete-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>
