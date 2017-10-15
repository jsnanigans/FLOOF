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
      activeTheme: 'dracula',
      themes,
      modes,
      loadedLangs: [],
      editorOptions: {
        mode: 'gfm',
        lineNumbers: false,
        theme: 'dracula'
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
    onEditorCodeChange () {}
  },

  mounted () {
  },

  watch: {
    activeTheme (newTheme) {
      console.log(this.$editor)
      this.$editor.setOption('theme', newTheme)
    }
  }
}
