<template>
  <div class="app">
    <main-editor/>
  </div>
</template>

<script>
import MainEditor from './components/MainEditor'
import 'vue-material-design-icons/styles.css'
require('@/assets/styles/main.sass')

export default {
  name: 'app',
  components: {
    MainEditor
  }
}
</script>
