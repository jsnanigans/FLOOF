<template>
  <div class="editor_wrap">
    <markdown-editor v-model="content" ref="markdownEditor"></markdown-editor>
  </div>
</template>

<script>
var comp = require('./MainEditor/script')
export default comp
</script>

<style lang="sass">
@import '~simplemde/dist/simplemde.min.css'

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

  .CodeMirror
    height: calc(100vh - 103px)
    min-height: 0
</style>
