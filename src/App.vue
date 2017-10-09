<template>
  <div class="app">
    <main-editor/>
  </div>
</template>

<script>
import MainEditor from './components/MainEditor'
require('@/assets/styles/main.sass')

export default {
  name: 'app',
  components: {
    MainEditor
  }
}
</script>
