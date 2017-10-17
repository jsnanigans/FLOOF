let tm = {}
let cm

tm.setup = editor => {
  cm = editor
}

tm.bold = _ => {

}

tm.getState = pos => {
  pos = pos || cm.getCursor('start')
  let stat = cm.getTokenAt(pos)
  if (!stat.type) return {}

  let types = stat.type.split(' ')

  let ret = {}
  let data
  let text

  for (let i = 0; i < types.length; i++) {
    data = types[i]
    if (data === 'strong') {
      ret.bold = true
    } else if (data === 'letiable-2') {
      text = cm.getLine(pos.line)
      if (/^\s*\d+\.\s/.test(text)) {
        ret['ordered-list'] = true
      } else {
        ret['unordered-list'] = true
      }
    } else if (data === 'atom') {
      ret.quote = true
    } else if (data === 'em') {
      ret.italic = true
    } else if (data === 'quote') {
      ret.quote = true
    } else if (data === 'strikethrough') {
      ret.strikethrough = true
    } else if (data === 'comment') {
      ret.code = true
    } else if (data === 'link') {
      ret.link = true
    } else if (data === 'tag') {
      ret.image = true
    } else if (data.match(/^header(-[1-6])?$/)) {
      ret[data.replace('header', 'heading')] = true
    }
  }
  return ret
}

tm.toolbar = type => {
  let selections = cm.listSelections()
  selections.forEach(sel => {
    console.log(tm.getState(sel.head))
  })

  // console.log(cm.getCursor())

  // let selections = cm.getSelections()
  // console.log(type, selections)
}

module.exports = tm
