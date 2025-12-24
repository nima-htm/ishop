import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import TransactionsView from './views/TransactionsView.vue'
import AddTransactionView from './views/AddTransactionView.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView
  },
  {
    path: '/add-transaction',
    name: 'add-transaction',
    component: AddTransactionView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
