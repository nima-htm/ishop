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
}

export default new DatabaseService();
