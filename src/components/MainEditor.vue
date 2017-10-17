<template>
  <div>
    <select name="theme" id="" v-model="activeTheme">
      <option v-for="theme in themes" :key="theme + '_'" :value="theme">{{theme}}</option>
    </select>

    <div class="editor_wrap">
      <div class="markdown-editor">

        <div class="toolbar">
          <div class="toolbar_buttons">
            <bold-icon class="icon" @click.native="toolbar('bold')" />
            <italic-icon class="icon" @click.native="toolbar('italic')" />
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
@import '../assets/styles/cm_font.sass'
@import '../assets/styles/toolbar.sass'
</style>
