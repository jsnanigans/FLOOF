import { codemirror } from 'vue-codemirror'
import themes from './themes'
import modes from './modes'

import BoldIcon from 'icons/format-bold'
import ItalicIcon from 'icons/format-italic'

import tm from './textmutations'

require('codemirror/addon/edit/continuelist.js')
require('codemirror/addon/mode/overlay.js')
require('codemirror/addon/selection/mark-selection.js')
require('codemirror/addon/selection/active-line.js')

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
        mode: {
          name: 'gfm',
          highlightFormatting: true
        },
        theme: 'material',
        tabSize: 2,
        indentUnit: 2,
        indentWithTabs: true,
        lineNumbers: false,
        autofocus: false,
        extraKeys: {'Enter': 'newlineAndIndentContinueMarkdownList'},
        lineWrapping: true,
        allowDropFileTypes: ['text/plain'],
        placeholder: '',
        styleSelectedText: true,
        styleActiveLine: true
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
      tm.setup(editor)
    },
    onEditorFocus () {},
    onEditorCodeChange () {},

    saveCode () {
      clearTimeout(this.saveCodeTimeout)
      this.saveCodeTimeout = setTimeout(_ => {
        localStorage.code = this.code
      }, 100)
    },

    toolbar (type) {
      tm.toolbar(type)
    }
  },

  mounted () {
    if (localStorage.code) {
      this.code = localStorage.code
    }
  },

  watch: {
    activeTheme (newTheme) {
      this.$editor.setOption('theme', newTheme)
    },
    code (newCode) {
      this.saveCode()
    }
  }
}
