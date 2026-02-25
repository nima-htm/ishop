import { createApp } from 'vue'
import './assets/fonts/arad.css'
import './style.css'
import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'
import BackupService from './services/BackupService.js'

dayjs.extend(jalaliday)
dayjs.calendar('jalali')

const app = createApp(App)
app.use(router).mount('#app')

// Perform automatic backup on app start
BackupService.autoBackup().catch(console.error);

export default dayjs
