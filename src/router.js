import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import ProductGroupView from './views/ProductGroupView.vue'
import ProductView from './views/ProductView.vue'
import SettingsView from './views/SettingsView.vue'

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
    path: '/product-groups',
    name: 'product-groups',
    component: ProductGroupView
  },
  {
    path: '/products',
    name: 'products',
    component: ProductView
 },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
