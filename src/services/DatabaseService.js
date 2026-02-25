class DatabaseService {
  constructor() {
    this.dbName = 'iShopDB';
    this.version = 2;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create product groups store
        if (!db.objectStoreNames.contains('productGroups')) {
          const productGroupStore = db.createObjectStore('productGroups', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          productGroupStore.createIndex('product_group_code', 'product_group_code', { unique: true });
          productGroupStore.createIndex('group_name', 'group_name', { unique: false });
        }

        // Create products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          productStore.createIndex('product_code', 'product_code', { unique: true });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('product_group_code', 'product_group_code', { unique: false });

        }

        // Create entrance store
        if (!db.objectStoreNames.contains('entrances')) {
          const entranceStore = db.createObjectStore('entrances', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          entranceStore.createIndex('product_code', 'product_code', { unique: false });
          entranceStore.createIndex('date', 'date', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { 
            keyPath: 'key' 
          });
        }
      };
    });
  }

  // Product Group Methods
  async addProductGroup(group) {
    if (!this.db) await this.init();
    
    const groupObj = {
      ...group,
      id: Date.now(), // Use timestamp as ID
      product_group_code: `PG${(Date.now() % 100000).toString().padStart(5, '0')}`, // Auto-generate product group code (max 5 digits)
      date_added: group.date_added || new Date().toISOString()
    };

    const transaction = this.db.transaction(['productGroups'], 'readwrite');
    const store = transaction.objectStore('productGroups');
    
    return new Promise((resolve, reject) => {
      const request = store.add(groupObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

 async getProductGroups() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['productGroups'], 'readonly');
    const store = transaction.objectStore('productGroups');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

 async updateProductGroup(id, updatedGroup) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['productGroups'], 'readwrite');
    const store = transaction.objectStore('productGroups');
    
    const existingGroup = await this.getProductGroup(id);
    const groupObj = {
      ...existingGroup,
      ...updatedGroup,
      id: id
    };

    return new Promise((resolve, reject) => {
      const request = store.put(groupObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductGroup(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['productGroups'], 'readonly');
    const store = transaction.objectStore('productGroups');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProductGroup(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['productGroups'], 'readwrite');
    const store = transaction.objectStore('productGroups');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

 // Product Methods
 async addProduct(product) {
    if (!this.db) await this.init();
    
    const productObj = {
      ...product,
      id: Date.now(), // Use timestamp as ID
      product_code: `P${(Date.now() % 100000).toString().padStart(5, '0')}`, // Auto-generate product code
   
    };

    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.add(productObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

 async getProducts() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

async updateProduct(id, productObj) {
  if (!this.db) await this.init();

  const transaction = this.db.transaction(['products'], 'readwrite');
  const store = transaction.objectStore('products');

  return new Promise((resolve, reject) => {
    const request = store.put({
      ...productObj,
      id: Number(id)
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
 async getProduct(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProduct(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Entrance Methods
 async addEntrance(entrance) {
    if (!this.db) await this.init();
    
    const entranceObj = {
      ...entrance,
      id: Date.now(), // Use timestamp as ID
      date: entrance.date || new Date().toISOString()
    };

    const transaction = this.db.transaction(['entrances'], 'readwrite');
    const store = transaction.objectStore('entrances');
    
    return new Promise((resolve, reject) => {
      const request = store.add(entranceObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntrances() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['entrances'], 'readonly');
    const store = transaction.objectStore('entrances');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntrance(id) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['entrances'], 'readonly');
    const store = transaction.objectStore('entrances');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProductQuantity(productCode, quantityToAdd) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    
    return new Promise(async (resolve, reject) => {
      try {
        // Get the product by product_code
        const productRequest = store.index('product_code').get(productCode);
        
        productRequest.onsuccess = () => {
          const product = productRequest.result;
          if (product) {
            // Update the quantity
            product.quantity = (product.quantity || 0) + quantityToAdd;
            
            const updateRequest = store.put(product);
            updateRequest.onsuccess = () => resolve(updateRequest.result);
            updateRequest.onerror = () => reject(updateRequest.error);
          } else {
            reject(new Error('Product not found'));
          }
        };
        
        productRequest.onerror = () => reject(productRequest.error);
      } catch (error) {
        reject(error);
      }
    });
  }

 // Settings Methods (preserved)
  async setSetting(key, value) {
    if (!this.db) await this.init();
    
    const settingsStore = this.db.transaction(['settings'], 'readwrite');
    const store = settingsStore.objectStore('settings');
    
    const settingObj = { key, value };
    
    return new Promise((resolve, reject) => {
      const request = store.put(settingObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    
    const settingsStore = this.db.transaction(['settings'], 'readonly');
    const store = settingsStore.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

 async getAllSettings() {
    if (!this.db) await this.init();
    
    const settingsStore = this.db.transaction(['settings'], 'readonly');
    const store = settingsStore.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async exportData() {
    if (!this.db) await this.init();
    
    // Use a single transaction for all stores
    const transaction = this.db.transaction(['products', 'productGroups', 'settings'], 'readonly');
    
    return new Promise((resolve, reject) => {
      const exportData = {};
      let completedStores = 0;
      const totalStores = 3;
      
      // Get all products
      const productRequest = transaction.objectStore('products').getAll();
      productRequest.onsuccess = () => {
        exportData.products = productRequest.result;
        completedStores++;
        if (completedStores === totalStores) {
          resolve(exportData);
        }
      };
      productRequest.onerror = () => reject(productRequest.error);
      
      // Get all product groups
      const groupRequest = transaction.objectStore('productGroups').getAll();
      groupRequest.onsuccess = () => {
        exportData.productGroups = groupRequest.result;
        completedStores++;
        if (completedStores === totalStores) {
          resolve(exportData);
        }
      };
      groupRequest.onerror = () => reject(groupRequest.error);
      
      // Get all settings
      const settingsRequest = transaction.objectStore('settings').getAll();
      settingsRequest.onsuccess = () => {
        exportData.settings = settingsRequest.result;
        exportData.exportDate = new Date().toISOString();
        exportData.version = '1.0';
        completedStores++;
        if (completedStores === totalStores) {
          resolve(exportData);
        }
      };
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
 }

  async importData(importData) {
    if (!this.db) await this.init();
    
    // Validate import data structure
    if (!importData.products || !importData.productGroups || !importData.settings) {
      throw new Error('Invalid import data structure');
    }

    // Clear existing data using a single transaction
    const transaction = this.db.transaction(['products', 'productGroups', 'settings'], 'readwrite');
    
    return new Promise((resolve, reject) => {
      let completedOperations = 0;
      const totalOperations = 3; // products, productGroups and settings
      
      // Clear and import products
      const productStore = transaction.objectStore('products');
      const clearProductsRequest = productStore.clear();
      
      clearProductsRequest.onsuccess = async () => {
        try {
          // Import products using put to preserve existing IDs
          for (const productData of importData.products) {
            await new Promise((res, rej) => {
              const request = productStore.put(productData);
              request.onsuccess = () => res(request.result);
              request.onerror = () => rej(request.error);
            });
          }
          completedOperations++;
          if (completedOperations === totalOperations) {
            resolve('Data imported successfully');
          }
        } catch (error) {
          reject(error);
        }
      };
      clearProductsRequest.onerror = () => reject(clearProductsRequest.error);
      
      // Clear and import product groups
      const groupStore = transaction.objectStore('productGroups');
      const clearGroupsRequest = groupStore.clear();
      
      clearGroupsRequest.onsuccess = async () => {
        try {
          // Import product groups
          for (const group of importData.productGroups) {
            await new Promise((res, rej) => {
              const request = groupStore.put(group);
              request.onsuccess = () => res(request.result);
              request.onerror = () => rej(request.error);
            });
          }
          completedOperations++;
          if (completedOperations === totalOperations) {
            resolve('Data imported successfully');
          }
        } catch (error) {
          reject(error);
        }
      };
      clearGroupsRequest.onerror = () => reject(clearGroupsRequest.error);
      
      // Clear and import settings
      const settingsStore = transaction.objectStore('settings');
      const clearSettingsRequest = settingsStore.clear();
      
      clearSettingsRequest.onsuccess = async () => {
        try {
          // Import settings
          for (const setting of importData.settings) {
            await new Promise((res, rej) => {
              const request = settingsStore.put(setting);
              request.onsuccess = () => res(request.result);
              request.onerror = () => rej(request.error);
            });
          }
          completedOperations++;
          if (completedOperations === totalOperations) {
            resolve('Data imported successfully');
          }
        } catch (error) {
          reject(error);
        }
      };
      clearSettingsRequest.onerror = () => reject(clearSettingsRequest.error);
    });
  }

  async getDatabaseStats() {
    if (!this.db) await this.init();
    
    // Use a single transaction for all stores
    const transaction = this.db.transaction(['products', 'productGroups', 'settings'], 'readonly');
    
    return new Promise((resolve, reject) => {
      const stats = {};
      let completedCounts = 0;
      const totalStores = 3;
      
      // Count products
      const productCount = transaction.objectStore('products').count();
      productCount.onsuccess = () => {
        stats.productCount = productCount.result;
        completedCounts++;
        if (completedCounts === totalStores) {
          resolve(stats);
        }
      };
      productCount.onerror = () => reject(productCount.error);
      
      // Count product groups
      const groupCount = transaction.objectStore('productGroups').count();
      groupCount.onsuccess = () => {
        stats.productGroupCount = groupCount.result;
        completedCounts++;
        if (completedCounts === totalStores) {
          resolve(stats);
        }
      };
      groupCount.onerror = () => reject(groupCount.error);
      
      // Count settings
      const settingsCount = transaction.objectStore('settings').count();
      settingsCount.onsuccess = () => {
        stats.settingsCount = settingsCount.result;
        completedCounts++;
        if (completedCounts === totalStores) {
          resolve(stats);
        }
      };
      settingsCount.onerror = () => reject(settingsCount.error);
    });
  }

  async exportAllData() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['productGroups', 'products', 'entrances', 'settings'], 'readonly');
    
    return new Promise((resolve, reject) => {
      const data = {};
      let completed = 0;
      const stores = ['productGroups', 'products', 'entrances', 'settings'];
      
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          data[storeName] = request.result;
          completed++;
          if (completed === stores.length) {
            resolve(data);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    });
  }
}

export default new DatabaseService();
