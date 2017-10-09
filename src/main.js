import Vue from 'vue'
import App from './App'
import VueSimplemde from 'vue-simplemde'

Vue.use(VueSimplemde)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
})
