<script setup>
import { ref, onMounted } from 'vue'
import DatabaseService from '../services/DatabaseService'
import { formatNumber } from 'chart.js/helpers'
// Initialize database
onMounted(async () => {
 await DatabaseService.init()
})

// Data service using IndexedDB
const DataService = {
  async getTransactions() {
    try {
      return await DatabaseService.getTransactions()
    } catch (error) {
      console.error('خطا در گرفتن تراکنش ها : ', error)
      return []
    }
 },
  
  async saveTransaction(transaction) {
    try {
      const transactionObj = {
        ...transaction,
        id: Date.now(), // Use timestamp as ID
        date: new Date().toISOString()
      }
      await DatabaseService.addTransaction(transactionObj)
      return transactionObj
    } catch (error) {
      console.error('خطا در ذخیره سازی تراکنش ها : ', error)
      throw error
    }
  },
  
  async updateTransaction(id, updatedTransaction) {
    try {
      const existingTransaction = await DatabaseService.getTransaction(id)
      const transactionObj = {
        ...existingTransaction,
        ...updatedTransaction,
        id: id
      }
      await DatabaseService.updateTransaction(id, transactionObj)
      return transactionObj
    } catch (error) {
      console.error('خطا در به روزرسانی تراکنش ها:', error)
      throw error
    }
  }
}

const form = ref({
  description: '',
  category: '',
  type: 'expense',
  number: '',
  amountPerItem: '',
  finalAmount: 0
})

const isEditing = ref(false)
const editingId = ref(null)
const transactions = ref([])

// Load transactions
onMounted(async () => {
  await DatabaseService.init()
  await loadTransactions()
})

const loadTransactions = async () => {
  transactions.value = await DataService.getTransactions()
}

// Reset form after submission
const resetForm = async () => {
  form.value = {
    description: '',
    category: '',
    type: 'expense',
    number: '',
    amountPerItem: '',
    finalAmount: 0
  }
  isEditing.value = false
  editingId.value = null
  errors.value = {}
  await loadTransactions() // Refresh the transaction list
}

// Form validation
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.description.trim()) {
    errors.value.description = 'عنوان کالا اجباری است'
  }
  
  if (!form.value.category.trim()) {
    errors.value.category = 'دسته بندی اجباری است'
  }
  
  if (!form.value.number || parseFloat(form.value.number) <= 0) {
    errors.value.number = 'تعداد باید عددی بزرگتر از صفر باشد'
  }
  
  if (!form.value.amountPerItem || parseFloat(form.value.amountPerItem) <= 0) {
    errors.value.amountPerItem = 'قیمت واحد باید عددی بزرگتر از صفر باشد'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) {
    return
  }
  
  const number = parseFloat(form.value.number)
  const amountPerItem = parseFloat(form.value.amountPerItem)
  
  const transaction = {
    description: form.value.description.trim(),
    category: form.value.category.trim(),
    type: form.value.type,
    number: number,
    amountPerItem: amountPerItem,
    finalAmount: number * amountPerItem
  }
  
  try {
    if (isEditing.value && editingId.value) {
      await DataService.updateTransaction(editingId.value, transaction)
      alert('تراکنش با موفقیت به روزرسانی شد')
    } else {
      await DataService.saveTransaction(transaction)
      alert('تراکنش با موفقیت افزوده گردید')
    }
    await resetForm()
  } catch (error) {
    console.error('خطا در ذخیره تراکنش:', error)
    alert('خطا !')
  }
}

// Edit transaction function
const editTransaction = (transaction) => {
  form.value = {
    description: transaction.description,
    category: transaction.category,
    type: transaction.type,
    number: transaction.number.toString(),
    amountPerItem: transaction.amountPerItem.toString(),
    finalAmount: transaction.finalAmount
  }
 isEditing.value = true
  editingId.value = transaction.id
}
</script>

<template>
  <div class="add-transaction">
    <h2>{{ isEditing ? 'ویرایش' : 'افزودن تراکنش جدید' }}</h2>
    
    <form @submit="handleSubmit" class="transaction-form">
      <div class="form-group">
        <label for="description">عنوان</label>
        <input
          type="text"
          id="description"
          v-model="form.description"
          :class="{ 'error': errors.description }"
          placeholder="مثال: فاستونی اعلا"
        />
        <span v-if="errors.description" class="error-message">
          {{ errors.description }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="category">دسته بندی</label>
        <input
          type="text"
          id="category"
          v-model="form.category"
          :class="{ 'error': errors.category }"
          placeholder="مثال : پارچه ای، جین، کتان و..."
        />
        <span v-if="errors.category" class="error-message">
          {{ errors.category }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="type">نوع مبلغ</label>
        <select id="type" v-model="form.type">
          <option value="income">(ورودی) درآمد</option>
          <option value="expense">(خروجی) هزینه</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="number">تعداد</label>
        <input
          type="number"
          id="number"
          v-model="form.number"
          :class="{ 'error': errors.number }"
          placeholder="0"
        />
        <span v-if="errors.number" class="error-message">
          {{ errors.number }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="amountPerItem">قیمت واحد (تومان)</label>
        <input
          type="number"
          id="amountPerItem"
          v-model="form.amountPerItem"
          :class="{ 'error': errors.amountPerItem }"
          placeholder="0"
        />
        <span v-if="errors.amountPerItem" class="error-message">
          {{ errors.amountPerItem }}
        </span>
      </div>
      
      <div class="form-group" v-if="form.number && form.amountPerItem">
        <label>مقدار نهایی (تومان)</label>
        <div class="final-amount-display">
          {{ formatNumber(parseFloat(form.number) * parseFloat(form.amountPerItem)) }}
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="submit-btn">
          ثبت
        </button>
        <button 
          type="button" 
          @click="resetForm" 
          class="cancel-btn"
          v-if="isEditing"
        >
          بازگشت
        </button>
      </div>
    </form>
    
    <div class="existing-transactions">
      <h3>تراکنش های اخیر</h3>
      <div class="transactions-list">
        <div 
          v-for="transaction in transactions.slice(-5)" 
          :key="transaction.id" 
          class="transaction-item"
        >
          <div class="transaction-info">
            <span class="description">{{ transaction.description }}</span>
            <span class="category">{{ transaction.category }}</span>
          </div>
          <div class="transaction-details">
            <span class="type" :class="transaction.type">
                {{ transaction.type === 'expense' ? 'هزینه' : 'درامد' }}

            </span>
            <span class="detail-item">
              <span class="detail-label">تعداد:</span>
              <span class="detail-value">{{ transaction.number }}</span>
            </span>
            <span class="detail-item">
              <span class="detail-label">واحد:</span>
              <span class="detail-value">{{ formatNumber(transaction.amountPerItem) }}</span>
            </span>
            <span class="amount" :class="transaction.type">
              {{ formatNumber(transaction.finalAmount)}}
            </span>
            <button 
              @click="editTransaction(transaction)"
              class="edit-btn"
            >
              ویرایش
            </button>
          </div>
        </div>
        
        <div v-if="transactions.length === 0" class="no-data">
          هیچ تراکنشی یافت نشد
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input, select{
      font-family: 'Arad', sans-serif;
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

.add-transaction {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.add-transaction h2 {
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  text-align: center;
  font-size: 1.75rem;
}

.transaction-form {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
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

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.form-group input.error {
  border-color: var(--danger);
}

.error-message {
  color: var(--danger);
  font-size: 0.875rem;
  margin-top: 0.35rem;
  display: block;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

.cancel-btn {
  background: var(--text-secondary);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: var(--text-primary);
}

.final-amount-display {
  background: var(--accent-light);
  border: 2px solid var(--accent);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
}

.existing-transactions {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.existing-transactions h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.transactions-list {
  max-height: 400px;
  overflow-y: auto;
  text-align: center;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0;
  gap: 1rem;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  flex: 1;
}

.transaction-info .description {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.transaction-info .category {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.transaction-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.type {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.type.income {
  background: rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.type.expense {
  background: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.detail-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
  font-weight: 500;
}

.amount {
  font-weight: 700;
  font-size: 1rem;
  min-width: 70px;
  text-align: right;
}

.amount.income {
  color: var(--success);
}

.amount.expense {
  color: var(--danger);
}

.edit-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .add-transaction {
    padding: 1rem;
  }

  .transaction-form {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .transaction-details {
    width: 100%;
    justify-content: space-between;
  }

  .amount {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .add-transaction {
    padding: 0.75rem;
  }

  .add-transaction h2 {
    font-size: 1.25rem;
  }

  .transaction-item {
    padding: 0.75rem;
  }

  .transaction-details {
    gap: 0.5rem;
  }

  .edit-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
}
</style>
