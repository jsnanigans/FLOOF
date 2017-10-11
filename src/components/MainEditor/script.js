import { codemirror } from 'vue-codemirror'
require('codemirror/mode/gfm/gfm.js')
require('./modes')

export default {
  name: 'MainEditor',
  data () {
    return {
      code: 'asd',
      loadedLangs: [],
      editorOptions: {
        mode: 'gfm',
        lineNumbers: false
      }
    }
  },
  mounted () {
  },
  watch: {
  },
  components: {
    codemirror
  }
}
