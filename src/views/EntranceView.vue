<script setup>
import { ref, onMounted, computed } from "vue";
import DatabaseService from "../services/DatabaseService";

// Utility function to format numbers with thousand separator
const formatNumberWithSeparator = (num) => {
  if (!num) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Initialize database
onMounted(async () => {
  await DatabaseService.init();
  await loadProducts();
  await loadEntrances();
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

  async getEntrances() {
    try {
      return await DatabaseService.getEntrances();
    } catch (error) {
      console.error("Error getting entrances:", error);
      return [];
    }
  },

  async addEntrance(entrance) {
    try {
      const entranceObj = {
        ...entrance,
        id: Date.now(),
        date: entrance.date || new Date().toISOString().split("T")[0],
      };
      await DatabaseService.addEntrance(entranceObj);
      return entranceObj;
    } catch (error) {
      console.error("Error saving entrance:", error);
      throw error;
    }
  },

  async updateProductQuantity(productCode, quantityToAdd) {
    try {
      await DatabaseService.updateProductQuantity(productCode, quantityToAdd);
    } catch (error) {
      console.error("Error updating product quantity:", error);
      throw error;
    }
  },
};

// Form data
const form = ref({
  product_code: "",
  selectedProduct: null,
  quantity: "",
  finished_cost_per_product: "",
  total_finished_cost: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
});

// Search functionality
const searchQuery = ref("");
const searchResults = ref([]);
const showSearchResults = ref(false);

// State management
const products = ref([]);
const entrances = ref([]);
const isFormMinimized = ref(false);

// Load initial data
onMounted(async () => {
  await DatabaseService.init();
  await loadProducts();
  await loadEntrances();
});

const loadProducts = async () => {
  const allProducts = await DataService.getProducts();
  products.value = allProducts;
};

const loadEntrances = async () => {
  const allEntrances = await DataService.getEntrances();
  // Sort by date (newest first)
  entrances.value = allEntrances.reverse();
};

// Search products by code or name
const searchProducts = (query) => {
  if (!query.trim()) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }

  const filtered = products.value.filter(
    (product) =>
      product.product_code.toLowerCase().includes(query.toLowerCase()) ||
      product.name.toLowerCase().includes(query.toLowerCase())
  );

  searchResults.value = filtered.slice(0, 10); // Limit to 10 results
  showSearchResults.value = filtered.length > 0;
};

// Select a product from search results
const selectProduct = (product) => {
  form.value.selectedProduct = product;
  form.value.product_code = product.product_code;
  showSearchResults.value = false;
};

// Calculate total cost when quantity or cost per product changes
const calculateTotalCost = () => {
  const quantity = parseFloat(form.value.quantity) || 0;
  const costPerProduct = parseFloat(form.value.finished_cost_per_product) || 0;
  form.value.total_finished_cost = (quantity * costPerProduct).toFixed(0);
};

// Form validation
const errors = ref({});

const validateForm = () => {
  errors.value = {};

  if (!form.value.selectedProduct) {
    errors.value.product_code = "انتخاب کالا الزامی است";
  }

  if (!form.value.quantity || parseFloat(form.value.quantity) <= 0) {
    errors.value.quantity = "تعداد باید عددی بزرگتر از صفر باشد";
  }

  if (
    !form.value.finished_cost_per_product ||
    parseFloat(form.value.finished_cost_per_product) < 0
  ) {
    errors.value.finished_cost_per_product = "هزینه واحد باید عددی مثبت باشد";
  }

  if (!form.value.date) {
    errors.value.date = "تاریخ الزامی است";
  }

  return Object.keys(errors.value).length === 0;
};

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const entrance = {
    product_code: form.value.product_code,
    quantity: parseFloat(form.value.quantity),
    finished_cost_per_product: parseFloat(form.value.finished_cost_per_product),
    total_finished_cost: parseFloat(form.value.total_finished_cost),
    date: form.value.date,
    description: form.value.description.trim(),
  };

  try {
    await DataService.addEntrance(entrance);

    // Update the product quantity
    await DataService.updateProductQuantity(
      form.value.product_code,
      parseFloat(form.value.quantity)
    );

    alert("ورود کالا با موفقیت ثبت شد");
    await resetForm();
    await loadEntrances();
  } catch (error) {
    console.error("Error saving entrance:", error);
    alert("خطا در ذخیره ورود کالا!");
  }
};

// Reset form
const resetForm = async () => {
  form.value = {
    product_code: "",
    selectedProduct: null,
    quantity: "",
    finished_cost_per_product: "",
    total_finished_cost: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  };
  errors.value = {};
  searchResults.value = [];
  showSearchResults.value = false;
};

// Filtered entrances for display
const filteredEntrances = computed(() => {
  return entrances.value.filter((entrance) => {
    const matchesProduct =
      !searchQuery.value ||
      entrance.product_code
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      products.value
        .find((p) => p.product_code === entrance.product_code)
        ?.name.toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    return matchesProduct;
  });
});

// Get product name by code
const getProductName = (productCode) => {
  const product = products.value.find((p) => p.product_code === productCode);
  return product ? product.name : productCode;
};
</script>

<template>
  <div class="entrance-view">
    <h2>ورود کالا</h2>

    <!-- Minimizable Form Section -->
    <div class="form-section">
      <div class="form-header" @click="isFormMinimized = !isFormMinimized">
        <h3>ثبت ورود کالا جدید</h3>
        <button class="minimize-btn">
          {{ isFormMinimized ? "بستن" : "باز کردن" }}
        </button>
      </div>

      <div v-if="isFormMinimized" class="entrance-form">
        <div class="form-grid">
          <div class="form-group">
            <div class="search-container">
              <input
                type="text"
                id="product_search"
                v-model="form.product_code"
                :class="{ error: errors.product_code }"
                placeholder="کد یا نام کالا را جستجو کنید"
                @input="searchProducts(form.product_code)"
                @focus="searchProducts(form.product_code)"
              />
              <div v-if="showSearchResults" class="search-results">
                <div
                  v-for="product in searchResults"
                  :key="product.id"
                  class="search-result-item"
                  @click="selectProduct(product)"
                >
                  <div class="product-info">
                    <strong>{{ product.product_code }}</strong>
                    <span>{{ product.name }}</span>
                  </div>
                </div>
              </div>
              <span v-if="errors.product_code" class="error-message">
                {{ errors.product_code }}
              </span>

              <!-- Display selected product -->
              <div v-if="form.selectedProduct" class="selected-product">
                <strong>{{ form.selectedProduct.product_code }}</strong> -
                {{ form.selectedProduct.name }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="quantity">تعداد</label>
            <input
              type="number"
              id="quantity"
              v-model="form.quantity"
              :class="{ error: errors.quantity }"
              placeholder="0"
              @input="calculateTotalCost"
            />
            <span v-if="errors.quantity" class="error-message">
              {{ errors.quantity }}
            </span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="finished_cost_per_product">هزینه واحد</label>
              <input
                type="number"
                id="finished_cost_per_product"
                v-model="form.finished_cost_per_product"
                :class="{ error: errors.finished_cost_per_product }"
                placeholder="0"
                @input="calculateTotalCost"
              />
              <span
                v-if="errors.finished_cost_per_product"
                class="error-message"
              >
                {{ errors.finished_cost_per_product }}
              </span>
            </div>

            <div class="form-group">
              <label for="total_finished_cost">هزینه کل</label>
              <input
                type="number"
                id="total_finished_cost"
                v-model="form.total_finished_cost"
                readonly
                placeholder="0"
                style="display: none"
              />
              <div
                style="
                  width: 100%;
                  padding: 0.6rem;
                  border: 2px solid var(--border-color);
                  border-radius: 8px;
                  font-size: 0.8rem;
                  background: var(--bg-primary);
                  color: var(--text-primary);
                  display: flex;
                  align-items: center;
                  font-weight: 600;
                "
              >
                {{ formatNumberWithSeparator(form.total_finished_cost) }}
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="date">تاریخ</label>
              <input
                type="date"
                id="date"
                v-model="form.date"
                :class="{ error: errors.date }"
              />
              <span v-if="errors.date" class="error-message">
                {{ errors.date }}
              </span>
            </div>

            <div class="form-group">
              <label for="description">توضیحات</label>
              <textarea
                id="description"
                v-model="form.description"
                placeholder="توضیحات اضافی (اختیاری)"
                rows="1"
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="submit-btn" @click="handleSubmit">
              ثبت ورود کالا
            </button>
            <button type="button" @click="resetForm" class="cancel-btn">
              بازگشت
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Entrances Table -->
    <div class="recent-entrances">
      <h3>ورودی های اخیر ({{ filteredEntrances.length }} مورد)</h3>
      <div class="table-container">
        <table class="entrances-table">
          <thead>
            <tr>
              <th>کد کالا</th>
              <th>نام کالا</th>
              <th>تعداد</th>
              <th>هزینه واحد</th>
              <th>هزینه کل</th>
              <th>تاریخ</th>
              <th>توضیحات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entrance in filteredEntrances" :key="entrance.id">
              <td>{{ entrance.product_code }}</td>
              <td>{{ getProductName(entrance.product_code) }}</td>
              <td class="number-cell">{{ entrance.quantity }}</td>
              <td class="number-cell">
                {{ entrance.finished_cost_per_product }}
              </td>
              <td class="number-cell">{{ entrance.total_finished_cost }}</td>
              <td>{{ entrance.date }}</td>
              <td>{{ entrance.description || "-" }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredEntrances.length === 0" class="no-data">
          ورودی کالایی یافت نشد
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
  --text-secondary: #666666;
  --border-color: #e1e5e9;
  --accent: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  --accent-light: #e0e7ff;
  --success: #10b981;
  --danger: #ef444;
}

[data-theme="dark"] {
  --bg-primary: #1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #4040;
  --accent: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  --accent-light: linear-gradient(135deg, #bb207b 0%, #8b5cf6 100%);
  --success: #34d399;
  --danger: #f87171;
}

.entrance-view {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.entrance-view h2 {
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
  grid-template-columns: 1fr;
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

.search-group input {
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

.search-group input:focus {
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

.entrance-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
}

.form-group input,
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
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 3px var(--accent-light);
}

.form-group input.error {
  border-color: var(--danger);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

/* Search container for product selection */
.search-container {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background: var(--bg-secondary);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-info strong {
  font-weight: 600;
}

.selected-product {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--accent-light);
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--text-primary);
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

.recent-entrances {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.recent-entrances h3 {
  margin: 0 1rem 1rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.table-container {
  overflow-x: auto;
}

.entrances-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  table-layout: auto;
}

.entrances-table th,
.entrances-table td {
  padding: 1rem 0.75rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

.entrances-table th {
  background: linear-gradient(150deg, #2c6a6e 0%, #622c86 100%);
  color: white;
  font-weight: 400;
  position: sticky;
  top: 0;
}

.entrances-table tbody tr {
  transition: all 0.2s ease;
}

.entrances-table tbody tr:hover {
  background: var(--bg-primary);
}

.entrances-table tbody tr:last-child td {
  border-bottom: none;
}

.number-cell {
  font-weight: 600;
  text-align: center;
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
  .entrance-view {
    padding: 1rem;
  }

  .entrance-view h2 {
    font-size: 1.4rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .entrances-table {
    display: block;
    overflow-x: auto;
  }

  .entrances-table thead {
    display: table-header-group;
  }

  .entrances-table tbody {
    display: table-row-group;
  }

  .entrances-table th,
  .entrances-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
    display: table-cell !important;
  }
}

@media (max-width: 480px) {
  .entrance-view {
    padding: 0.75rem;
  }

  .entrance-view h2 {
    font-size: 1.2rem;
  }

  .entrances-table {
    font-size: 0.85rem;
  }

  .entrances-table th,
  .entrances-table td {
    padding: 0.6rem 0.4rem;
  }

  .entrances-table th {
    font-size: 0.75rem;
  }
}
</style>
