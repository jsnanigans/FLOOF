<template>
  <div class="markdown-editor">
    <textarea ref="code">
      GitHub Flavored Markdown
========================

Everything from markdown plus GFM features:

## URL autolinking

Underscores_are_allowed_between_words.

## Strikethrough text

GFM adds syntax to strikethrough text, which is missing from standard Markdown.

~~Mistaken text.~~
~~**works with other formatting**~~

~~spans across
lines~~

## Fenced code blocks (and syntax highlighting)

```javascript
for (var i = 0; i &lt; items.length; i++) {
    console.log(items[i], i); // log them
}
```

## Task Lists

- [ ] Incomplete task list item
- [x] **Completed** task list item

    </textarea>
  </div>
</template>

<script>
// import SimpleMDE from '../assets/simplemde'
import CodeMirror from 'codemirror'

export default {
  name: 'markdown-editor',
  props: {
    value: String,
    highlight: {
      type: Boolean,
      default () {
        return false
      }
    },
    configs: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  methods: {
  },
  mounted () {
    this.$editor = CodeMirror.fromTextArea(this.$refs.code, {
      mode: {
        name: 'gfm',
        tokenTypeOverrides: {
          emoji: 'emoji'
        }
      },
      lineNumbers: true,
      theme: 'default'
    })
  },
  destroyed () {
  },
  watch: {

  }
}
</script>

<style>
.markdown-editor .markdown-body {
  padding: 0.5em
}

.markdown-editor .editor-preview-active, .markdown-editor .editor-preview-active-side {
  display: block
}
</style>
