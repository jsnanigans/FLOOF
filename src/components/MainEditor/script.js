import { codemirror } from 'vue-codemirror'
import themes from './themes'
import modes from './modes'

require('codemirror/mode/gfm/gfm.js')

// require('./modes')

export default {
  name: 'MainEditor',
  data () {
    return {
      code: 'asd',
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
  },
  components: {
    codemirror
  }
}
