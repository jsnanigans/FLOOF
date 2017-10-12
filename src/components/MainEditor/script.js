import { codemirror } from 'vue-codemirror'
import themes from './themes'
import modes from './modes'
import MenuIcon from 'vue-material-design-icons/menu.vue'

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
    MenuIcon,
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
