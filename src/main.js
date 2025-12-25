import { createApp } from 'vue'
import './assets/fonts/arad.css'
import './style.css'
import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import jalaliday from 'jalaliday'


dayjs.extend(jalaliday)
dayjs.calendar('jalali')

createApp(App).use(router).mount('#app')
export default dayjs