import { codemirror } from 'vue-codemirror'
import themes from './themes'
import modes from './modes'

import BoldIcon from 'icons/format-bold'
import ItalicIcon from 'icons/format-italic'

require('codemirror/mode/gfm/gfm.js')

export default {
  name: 'MainEditor',
  data () {
    return {
      code: '',
      saveCodeTimeout: false,
      activeTheme: 'dracula',
      themes,
      modes,
      loadedLangs: [],
      editorOptions: {
        mode: 'gfm',
        lineNumbers: false,
        theme: 'eclipse'
      }
    }
  },

  components: {
    BoldIcon,
    ItalicIcon,
    codemirror
  },

  methods: {
    onEditorReady (editor) {
      this.$editor = editor
    },
    onEditorFocus () {},
    onEditorCodeChange () {},

    saveCode () {
      clearTimeout(this.saveCodeTimeout)
      this.saveCodeTimeout = setTimeout(_ => {
        localStorage.code = this.code
      }, 100)
    }
  },

  mounted () {
    if (localStorage.code) {
      this.code = localStorage.code
    }
  },

  watch: {
    activeTheme (newTheme) {
      console.log(this.$editor)
      this.$editor.setOption('theme', newTheme)
    },
    code (newCode) {
      this.saveCode()
    }
  }
}
