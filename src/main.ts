import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import '../public/rem.js'
import './assets/css/base.less'

createApp(App)
  .use(store)
  .use(router)
  .mount('#app')
