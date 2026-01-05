<script setup>
import { ref, onMounted, computed } from "vue";
import DatabaseService from "../services/DatabaseService";

// Initialize database
onMounted(async () => {
  await DatabaseService.init();
  await loadProducts();
  await loadProductGroups();
});

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

  async saveProduct(product) {
    try {
      const productObj = {
        ...product,
        id: Date.now(), // Use timestamp as ID
      };
      await DatabaseService.addProduct(productObj);
      return productObj;
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  },

  async updateProduct(id, updatedProduct) {
    try {
      const existingProduct = await DatabaseService.getProduct(Number(id));

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      const productObj = {
        ...existingProduct,
        ...updatedProduct,
        id: Number(id),
      };

      await DatabaseService.updateProduct(Number(id), productObj);

      return productObj;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      await DatabaseService.deleteProduct(id);
      return await this.getProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      return [];
    }
  },
};

const form = ref({
  name: "",
  product_group_code: "",
  description: "",

  quantity: "",
});

const isEditing = ref(false);
const editingId = ref(null);
const isFormMinimized = ref(false);
const isSearchMinimized = ref(false);
const products = ref([]);
const productGroups = ref([]);

// Search functionality
const searchQuery = ref("");
const searchDate = ref("");
const searchGroup = ref("");

// Load products and product groups
onMounted(async () => {
  await DatabaseService.init();
  await loadProducts();
  await loadProductGroups();
});

const loadProducts = async () => {
  const allProducts = await DataService.getProducts();
  // Sort by date added (newest first)
  products.value = allProducts.reverse();
};

const loadProductGroups = async () => {
  const allGroups = await DataService.getProductGroups();
  productGroups.value = allGroups;
};

// Reset form after submission
const resetForm = async () => {
  form.value = {
    name: "",
    product_group_code: "",
    description: "",
    quantity: "",
  };
  isEditing.value = false;
  editingId.value = null;
  errors.value = {};
  await loadProducts();
};

// Form validation
const errors = ref({});

const validateForm = () => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = "شرح کالا اجباری است";
  }

  if (!form.value.product_group_code) {
    errors.value.product_group_code = "نوع کالا اجباری است";
  }

  if (!form.value.quantity || parseFloat(form.value.quantity) <= 0) {
    errors.value.quantity = "تعداد باید عددی بزرگتر از صفر باشد";
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const product = {
    name: form.value.name.trim(),
    product_group_code: form.value.product_group_code,
    description: form.value.description.trim(),
    is_entrance: form.value.is_entrance,
    quantity: parseFloat(form.value.quantity),
  };

  try {
    if (isEditing.value && editingId.value) {
      await DataService.updateProduct(Number(editingId.value), product);

      alert("کالا با موفقیت به روزرسانی شد");
    } else {
      await DataService.saveProduct(product);
      alert("کالا با موفقیت افزوده شد");
    }
    await resetForm();
  } catch (error) {
    console.error("Error saving product:", error);
    alert("خطا در ذخیره کالا!");
  }
};

// Edit product function
const editProduct = (product) => {
  form.value = {
    name: product.name,
    product_group_code: product.product_group_code,
    description: product.description,

    quantity: product.quantity.toString(),
  };
  isEditing.value = true;
  editingId.value = Number(product.id);
};

// Delete product function
const deleteProduct = async (id) => {
  if (confirm("آیا از حذف این کالا اطمینان دارید؟")) {
    await DataService.deleteProduct(id);
    await loadProducts();
  }
};

// Get product group name by code
const getProductGroupName = (groupCode) => {
  const group = productGroups.value.find(
    (g) => g.product_group_code === groupCode
  );
  return group ? group.group_name : groupCode;
};

// Filter products based on search criteria
const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesName =
      !searchQuery.value ||
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.description
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());
    const matchesGroup =
      !searchGroup.value ||
      product.product_group_code === searchGroup.value ||
      getProductGroupName(product.product_group_code)
        .toLowerCase()
        .includes(searchGroup.value.toLowerCase());

    return matchesName && matchesGroup;
  });
});
</script>

<template>
  <div class="product-view">
    <h2>مدیریت انبار</h2>

    <!-- Search Section -->
    <div class="search-section">
      <div class="form-header" @click="isSearchMinimized = !isSearchMinimized">
        <h3>جست و جو</h3>
        <button class="minimize-btn">
          {{ isSearchMinimized ? "بستن" : "باز کردن" }}
        </button>
      </div>
      <div v-if="isSearchMinimized" class="search-grid">
        <div class="search-group">
          <label for="search-name">جستجوی شرح/توضیحات</label>
          <input
            type="text"
            id="search-name"
            v-model="searchQuery"
            placeholder="شرح یا توضیحات کالا را وارد کنید"
          />
        </div>

        <div class="search-group">
          <label for="search-group">نوع کالا</label>
          <select id="search-group" v-model="searchGroup">
            <option value="">همه نوع کالا‌ها</option>
            <option
              v-for="group in productGroups"
              :key="group.id"
              :value="group.product_group_code"
            >
              {{ group.group_name }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <!-- Minimizable Form Section -->
    <div class="form-section">
      <div class="form-header" @click="isFormMinimized = !isFormMinimized">
        <h3>{{ isEditing ? "ویرایش کالا" : "افزودن کالا جدید" }}</h3>
        <button class="minimize-btn">
          {{ isFormMinimized ? "بستن" : "باز کردن" }}
        </button>
      </div>

      <div v-if="isFormMinimized" class="product-form">
        <div class="form-grid">
          <div class="form-group">
            <input
              type="text"
              id="name"
              v-model="form.name"
              :class="{ error: errors.name }"
              placeholder="شرح کالا را وارد کنید"
            />
            <span v-if="errors.name" class="error-message">
              {{ errors.name }}
            </span>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <select
              id="product_group_code"
              v-model="form.product_group_code"
              :class="{ error: errors.product_group_code }"
            >
              <option value="">انتخاب نوع کالا</option>
              <option
                v-for="group in productGroups"
                :key="group.id"
                :value="group.product_group_code"
              >
                {{ group.group_name }}
              </option>
            </select>
            <span v-if="errors.product_group_code" class="error-message">
              {{ errors.product_group_code }}
            </span>
          </div>
        </div>

        <div class="form-group">
          <textarea
            id="description"
            v-model="form.description"
            placeholder="سایز کالا یا سایر جزییات را وارد نمایید (اختیاری)"
            rows="1"
          ></textarea>
        </div>

        <div class="form-grid">
          <div class="form-grid">
            <div class="form-group quantity-group">
              <label for="quantity">تعداد</label>
              <input
                type="number"
                id="quantity"
                v-model="form.quantity"
                :class="{ error: errors.quantity }"
                placeholder="0"
              />
              <span v-if="errors.quantity" class="error-message">
                {{ errors.quantity }}
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn" @click="handleSubmit">
              {{ isEditing ? "به روزرسانی" : "ثبت" }}
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
        </div>
      </div>
    </div>
    <!-- Products Table -->
    <div class="existing-products">
      <h3>کالاها ({{ filteredProducts.length }} مورد)</h3>
      <div class="table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th>کد کالا</th>
              <th>نوع کالا</th>
              <th class="title">شرح کالا</th>
              <th class="descrip">جزییات</th>
              <th>تعداد</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>{{ product.product_code }}</td>
              <td>{{ getProductGroupName(product.product_group_code) }}</td>
              <td>{{ product.name }}</td>

              <td>{{ product.description || "-" }}</td>

              <td class="number-cell">{{ product.quantity }}</td>
              <td>
                <button @click="editProduct(product)" class="edit-btn">
                  ویرایش
                </button>
                <button @click="deleteProduct(product.id)" class="delete-btn">
                  حذف
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredProducts.length === 0" class="no-data">
          کالایی یافت نشد
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input,
select,
textarea {
  font-family: "Arad", sans-serif;
}

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #1a1a;
  --text-secondary: #6666;
  --border-color: #e1e5e9;
  --accent: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef4444;
}

[data-theme="dark"] {
  --bg-primary: #1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent: #818cf8;
  --accent-light: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  --success: #34d399;
  --danger: #f87171;
}

.product-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.product-view h2 {
  margin: 0 1.5rem 1rem;
  color: var(--text-primary);
  text-align: center;
  font-size: 1.75rem;
}

/* Search Section */
.search-section {
  border-radius: 12px;

  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
}

.search-grid {
  display: grid;
  padding: 1rem;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.search-group {
  margin-bottom: 0;
}

.search-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.search-group input,
.search-group select {
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

.search-group input:focus,
.search-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 3px var(--accent-light);
}

/* Form Section */
.form-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.form-header {
  padding: 1rem 1.5rem;
  background: var(--accent);
  color: white;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header h3 {
  margin: 0;
  font-size: 1rem;
}

.minimize-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.minimize-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.product-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.title {
  width: auto !important;
}
.descrip {
  width: 100px !important;
}
.form-group {
  margin-bottom: 1.25rem;
}

.quantity-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-group label {
  display: block;
  margin-bottom: 0;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8rem;
  width: 20%;
  flex-shrink: 0;
}

.quantity-group input {
  width: 80%;
  margin-bottom: 0;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.8rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 3px var(--accent-light);
}

.form-group input.error,
.form-group select.error {
  border-color: var(--danger);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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
  background: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(9, 102, 241, 0.3);
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

.existing-products {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.existing-products h3 {
  margin: 0 1rem 1rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.table-container {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  table-layout: auto;
}

.products-table th,
.products-table td {
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.products-table th {
  background: linear-gradient(150deg, #2c6a6e 0%, #622c86 100%);
  color: white;
  font-weight: 400;
  position: sticky;
  top: 0;
}

.products-table tbody tr {
  transition: all 0.2s ease;
}

.products-table tbody tr:hover {
  background: var(--bg-primary);
}

.products-table tbody tr:last-child td {
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

.number-cell {
  font-weight: 600;
  text-align: center;
}

.amount-cell {
  font-weight: 600;
  text-align: center;
}

.amount {
  font-weight: 700;
  font-size: 1rem;
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
  .product-view {
    padding: 1rem;
  }

  .product-view h2 {
    font-size: 1.4rem;
  }

  .search-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .products-table {
    display: block;
    overflow-x: auto;
  }

  .products-table thead {
    display: table-header-group;
  }

  .products-table tbody {
    display: table-row-group;
  }

  .products-table th,
  .products-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
    display: table-cell !important;
  }

  .title {
    width: 250px !important;
    min-width: 200px !important;
  }

  .descrip {
    width: 100px !important;
    min-width: 100px !important;
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
  .title {
    width: 250px !important;
    min-width: 200px !important;
  }

  .descrip {
    width: 100px !important;
    min-width: 100px !important;
  }
  .product-view {
    padding: 0.75rem;
  }

  .product-view h2 {
    font-size: 1.2rem;
  }

  .products-table {
    font-size: 0.85rem;
  }

  .products-table th,
  .products-table td {
    padding: 0.6rem 0.4rem;
  }

  .products-table th {
    font-size: 0.75rem;
  }

  .type-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }

  .amount {
    font-size: 0.9rem;
  }

  .edit-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }

  .delete-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>
