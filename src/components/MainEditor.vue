<template>
  <div class="editor_wrap">
    <editor v-model="content" :configs="configs" ref="markdownEditor"></editor>
  </div>
</template>

<script>
var comp = require('./MainEditor/script')
export default comp
</script>

<style lang="sass">
@import '../assets/styles/codemirror.sass'

.editor_wrap
  position: absolute
  left: 0
  top: 0
  right: 0
  bottom: 0
  // .markdown-editor
  //   position: absolute
  //   left: 100%
  //   height: 100%

  .markdown-editor
    height: 100%
    
  .CodeMirror
    height: calc(100vh - 113px)
    min-height: 0
</style>
