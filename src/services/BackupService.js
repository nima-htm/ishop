import DatabaseService from './DatabaseService.js';

class BackupService {
  constructor() {
    this.apiUrl = '/api/backup'; // Vercel API endpoint
    this.lastBackupKey = 'lastBackupTime';
  }

  async backupData() {
    try {
      const data = await DatabaseService.exportAllData();
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
          userId: this.getUserId(), // You might need to implement user identification
        }),
      });

      if (response.ok) {
        localStorage.setItem(this.lastBackupKey, Date.now().toString());
        console.log('Data backed up successfully');
        return true;
      } else {
        console.error('Backup failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Backup error:', error);
      return false;
    }
  }

  shouldBackup() {
    const lastBackup = localStorage.getItem(this.lastBackupKey);
    if (!lastBackup) return true;
    const timeSinceLastBackup = Date.now() - parseInt(lastBackup);
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return timeSinceLastBackup > oneDay;
  }

  getUserId() {
    // Implement a way to get unique user ID, e.g., from settings or generate one
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async autoBackup() {
    if (this.shouldBackup()) {
      await this.backupData();
    }
  }
}

export default new BackupService();