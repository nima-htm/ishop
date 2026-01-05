<script setup>
import { ref, onMounted } from 'vue'
import DatabaseService from '../services/DatabaseService'

// Initialize database
onMounted(async () => {
  await DatabaseService.init()
  await loadProductGroups()
})

// Data service using IndexedDB
const DataService = {
  async getProductGroups() {
    try {
      return await DatabaseService.getProductGroups()
    } catch (error) {
      console.error('Error getting product groups:', error)
      return []
    }
  },
  
  async saveProductGroup(group) {
    try {
      const groupObj = {
        ...group,
        id: Date.now(), // Use timestamp as ID
        date_added: new Date().toISOString()
      }
      await DatabaseService.addProductGroup(groupObj)
      return groupObj
    } catch (error) {
      console.error('Error saving product group:', error)
      throw error
    }
  },
  
  async updateProductGroup(id, updatedGroup) {
    try {
      const existingGroup = await DatabaseService.getProductGroup(id)
      const groupObj = {
        ...existingGroup,
        ...updatedGroup,
        id: id
      }
      await DatabaseService.updateProductGroup(id, groupObj)
      return groupObj
    } catch (error) {
      console.error('Error updating product group:', error)
      throw error
    }
  },
  
  async deleteProductGroup(id) {
    try {
      await DatabaseService.deleteProductGroup(id)
      return await this.getProductGroups()
    } catch (error) {
      console.error('Error deleting product group:', error)
      return []
    }
 }
}

const form = ref({
  group_name: ''
})

const isEditing = ref(false)
const editingId = ref(null)
const productGroups = ref([])

// Load product groups
onMounted(async () => {
 await DatabaseService.init()
  await loadProductGroups()
})

const loadProductGroups = async () => {
  const allGroups = await DataService.getProductGroups()
  // Sort by date added (newest first)
  productGroups.value = allGroups.reverse()
}

// Reset form after submission
const resetForm = async () => {
  form.value = {
    group_name: ''
  }
  isEditing.value = false
  editingId.value = null
  errors.value = {}
  await loadProductGroups() // Refresh the list
}

// Form validation
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.group_name.trim()) {
    errors.value.group_name = 'نوع کالا اجباری است'
  } else if (form.value.group_name.trim().length > 128) {
    errors.value.group_name = ' نوع کالا نباید بیشتر از 128 کاراکتر باشد'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) {
    return
  }
  
  const group = {
    group_name: form.value.group_name.trim()
 }
  
  try {
    if (isEditing.value && editingId.value) {
      await DataService.updateProductGroup(editingId.value, group)
      alert('نوع کالا با موفقیت به روزرسانی شد')
    } else {
      await DataService.saveProductGroup(group)
      alert('نوع کالا با موفقیت افزوده شد')
    }
    await resetForm()
  } catch (error) {
    console.error('Error saving product group:', error)
    alert('خطا در ذخیره نوع کالا!')
  }
}

// Edit product group function
const editProductGroup = (group) => {
  form.value = {
    group_name: group.group_name
  }
 isEditing.value = true
  editingId.value = group.id
}

// Delete product group function
const deleteProductGroup = async (id) => {
  if (confirm('آیا از حذف این نوع کالا کالا اطمینان دارید؟')) {
    await DataService.deleteProductGroup(id)
    await loadProductGroups()
  }
}
</script>

<template>
  <div class="product-group-view">
    <h2>{{ isEditing ? 'ویرایش نوع کالا' : 'افزودن نوع کالا جدید' }}</h2>
    <br />
    <form @submit="handleSubmit" class="product-group-form">
      <div class="form-group">
    <input
          type="text"
          id="group_name"
          v-model="form.group_name"
          :class="{ 'error': errors.group_name }"
          placeholder="نام نوع کالا را وارد کنید"
        />
        <span v-if="errors.group_name" class="error-message">
          {{ errors.group_name }}
        </span>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="submit-btn">
          {{ isEditing ? 'به روزرسانی' : 'ثبت' }}
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
    
    <div class="existing-product-groups">
      <h3>نوع کالا های کالا</h3>
      <div class="table-container">
        <table class="groups-table">
          <thead>
            <tr>
              <th>کد نوع کالا</th>
              <th>نام نوع کالا</th>
              <th>تاریخ ایجاد</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in productGroups" :key="group.id">
              <td>{{ group.product_group_code }}</td>
              <td>{{ group.group_name }}</td>
              <td>{{ new Date(group.date_added).toLocaleDateString('fa-IR') }}</td>
              <td>
                <button 
                  @click="editProductGroup(group)"
                  class="edit-btn"
                >
                  ویرایش
                </button>
                <button 
                  @click="deleteProductGroup(group.id)"
                  class="delete-btn"
                >
                  حذف
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="productGroups.length === 0" class="no-data">
          نوع کالا کالایی یافت نشد
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input {
  font-family: 'Arad', sans-serif;
}

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a;
  --text-secondary: #66666;
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
  --danger: #f871;
}

.product-group-view {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.product-group-view h2 {
  margin: 0 1.5rem 0;
  color: var(--text-primary);
  text-align: center;
  font-size: 1.75rem;
}

.product-group-form {
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

.form-group input {
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

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 3px var(--accent-light);
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

.existing-product-groups {
  background: var(--bg-secondary);
  padding: 1.5rem;
 border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.existing-product-groups h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.table-container {
  overflow-x: auto;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.groups-table th,
.groups-table td {
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
 color: var(--text-primary);
}

.groups-table th {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-weight: 500;
  position: sticky;
  top: 0;
}

.groups-table tbody tr {
  transition: all 0.2s ease;
}

.groups-table tbody tr:hover {
  background: var(--bg-primary);
}

.groups-table tbody tr:last-child td {
  border-bottom: none;
}

.edit-btn {
  background: var(--accent);
  color: white;
  border: none;
 padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
 font-weight: 600;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(9, 102, 241, 0.3);
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

.no-data {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
 font-style: italic;
  font-size: 1.05rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .product-group-view {
    padding: 1rem;
  }

  .product-group-view h2 {
    font-size: 1.4rem;
  }

  .product-group-form {
    padding: 1rem;
 }

  .form-actions {
    flex-direction: column;
  }

  .groups-table th,
  .groups-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .edit-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    margin-left: 0.25rem;
 }

  .delete-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .product-group-view {
    padding: 0.75rem;
  }

  .product-group-view h2 {
    font-size: 1.2rem;
 }

  .groups-table {
    font-size: 0.85rem;
  }

 .groups-table th,
  .groups-table td {
    padding: 0.6rem 0.4rem;
  }

  .groups-table th {
    font-size: 0.75rem;
  }
}
</style>
