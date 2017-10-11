<template>
  <div class="editor_wrap">
    <div class="markdown-editor">
      <codemirror v-model="code" :options="editorOptions"></codemirror>
    </div>
  </div>
</template>

<script>
var comp = require('./MainEditor/script')
export default comp
</script>

<style lang="sass">
@import '../assets/styles/codemirror.sass'
</style>
