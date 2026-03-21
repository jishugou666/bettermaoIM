import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/Chat.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/Friends.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/credits',
      name: 'credits',
      component: () => import('../views/Credits.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/moments',
      name: 'moments',
      component: () => import('../views/Moments.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/moment/:id',
      name: 'moment-detail',
      component: () => import('../views/MomentDetail.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
