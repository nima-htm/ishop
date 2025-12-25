class DatabaseService {
  constructor() {
    this.dbName = 'FinancialManagerDB';
    this.version = 1;
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
        
        // Create transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          transactionStore.createIndex('category', 'category', { unique: false });
          transactionStore.createIndex('amount', 'amount', { unique: false });
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

  async addTransaction(transaction) {
    if (!this.db) await this.init();
    
    const transactionObj = {
      ...transaction,
      id: Date.now(), // Use timestamp as ID
      date: transaction.date || new Date().toISOString()
    };

    const transactionStore = this.db.transaction(['transactions'], 'readwrite');
    const store = transactionStore.objectStore('transactions');
    
    return new Promise((resolve, reject) => {
      const request = store.add(transactionObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

 async getTransactions() {
    if (!this.db) await this.init();
    
    const transactionStore = this.db.transaction(['transactions'], 'readonly');
    const store = transactionStore.objectStore('transactions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
 }

  async updateTransaction(id, updatedTransaction) {
    if (!this.db) await this.init();
    
    const transactionStore = this.db.transaction(['transactions'], 'readwrite');
    const store = transactionStore.objectStore('transactions');
    
    const existingTransaction = await this.getTransaction(id);
    const transactionObj = {
      ...existingTransaction,
      ...updatedTransaction,
      id: id
    };

    return new Promise((resolve, reject) => {
      const request = store.put(transactionObj);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransaction(id) {
    if (!this.db) await this.init();
    
    const transactionStore = this.db.transaction(['transactions'], 'readonly');
    const store = transactionStore.objectStore('transactions');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
 }

  async deleteTransaction(id) {
    if (!this.db) await this.init();
    
    const transactionStore = this.db.transaction(['transactions'], 'readwrite');
    const store = transactionStore.objectStore('transactions');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearTransactions() {
    if (!this.db) await this.init();
    
    const transactionStore = this.db.transaction(['transactions'], 'readwrite');
    const store = transactionStore.objectStore('transactions');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

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
    
    // Use a single transaction for both stores
    const transaction = this.db.transaction(['transactions', 'settings'], 'readonly');
    
    return new Promise((resolve, reject) => {
      const exportData = {};
      let completedStores = 0;
      
      // Get all transactions
      const transactionRequest = transaction.objectStore('transactions').getAll();
      transactionRequest.onsuccess = () => {
        exportData.transactions = transactionRequest.result;
        completedStores++;
        if (completedStores === 2) {
          resolve(exportData);
        }
      };
      transactionRequest.onerror = () => reject(transactionRequest.error);
      
      // Get all settings
      const settingsRequest = transaction.objectStore('settings').getAll();
      settingsRequest.onsuccess = () => {
        exportData.settings = settingsRequest.result;
        exportData.exportDate = new Date().toISOString();
        exportData.version = '1.0';
        completedStores++;
        if (completedStores === 2) {
          resolve(exportData);
        }
      };
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
  }

  async importData(importData) {
    if (!this.db) await this.init();
    
    // Validate import data structure
    if (!importData.transactions || !importData.settings) {
      throw new Error('Invalid import data structure');
    }

    // Clear existing data using a single transaction
    const transaction = this.db.transaction(['transactions', 'settings'], 'readwrite');
    
    return new Promise((resolve, reject) => {
      let completedOperations = 0;
      const totalOperations = 2; // transactions and settings
      
      // Clear and import transactions
      const transactionStore = transaction.objectStore('transactions');
      const clearTransactionsRequest = transactionStore.clear();
      
      clearTransactionsRequest.onsuccess = async () => {
        try {
          // Import transactions using put to preserve existing IDs
          for (const transactionData of importData.transactions) {
            await new Promise((res, rej) => {
              const request = transactionStore.put(transactionData);
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
      clearTransactionsRequest.onerror = () => reject(clearTransactionsRequest.error);
      
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
    
    // Use a single transaction for both stores
    const transaction = this.db.transaction(['transactions', 'settings'], 'readonly');
    
    return new Promise((resolve, reject) => {
      const stats = {};
      let completedCounts = 0;
      
      // Count transactions
      const transactionCount = transaction.objectStore('transactions').count();
      transactionCount.onsuccess = () => {
        stats.transactionCount = transactionCount.result;
        completedCounts++;
        if (completedCounts === 2) {
          resolve(stats);
        }
      };
      transactionCount.onerror = () => reject(transactionCount.error);
      
      // Count settings
      const settingsCount = transaction.objectStore('settings').count();
      settingsCount.onsuccess = () => {
        stats.settingsCount = settingsCount.result;
        completedCounts++;
        if (completedCounts === 2) {
          resolve(stats);
        }
      };
      settingsCount.onerror = () => reject(settingsCount.error);
    });
  }
}

export default new DatabaseService();
