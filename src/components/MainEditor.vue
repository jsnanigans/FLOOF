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
</style>
