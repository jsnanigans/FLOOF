<template>
  <div>
    <select name="theme" id="" v-model="activeTheme">
      <option v-for="theme in themes" :key="theme + '_'" :value="theme">{{theme}}</option>
    </select>

    <div class="editor_wrap">
      <div class="markdown-editor">

        <div class="toolbar">
          <div class="toolbar_btn">
            <menu-icon />
          </div>
        </div>

        <codemirror v-model="code" :options="editorOptions"
          @ready="onEditorReady"
          @focus="onEditorFocus"
          @change="onEditorCodeChange"
        ></codemirror>

      </div>
    </div>
  </div>
</template>

<script>
var comp = require('./MainEditor/script')
export default comp
</script>

<style lang="sass">
@import '../assets/styles/codemirror.sass'
@import '../assets/styles/toolbar.sass'
</style>
