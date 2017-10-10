import editor from '../Editor'

export default {
  name: 'MainEditor',
  components: {
    editor
  },
  data () {
    return {
      content: 'qweqwe',
      theme: '',
      configs: {
        spellChecker: false,
        autofocus: true,
        toolbar: [
          'bold', 'italic', 'strikethrough', '|',
          'horizontal-rule', '|',
          // 'heading',
          'heading-smaller', 'heading-bigger', '|',
          'code', 'quote', '|',
          'unordered-list', 'ordered-list', '|',
          // 'clean-block'
          'link', 'image', 'table', '|',
          'preview', 'side-by-side'
          // 'fullscreen'
          // '|',
          // 'guide'
        ]
      }
    }
  },

  mounted () {
  }
}
