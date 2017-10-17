let tm = {}
let cm

let typeCharsMap = {
  bold: ['**', '**'],
  italic: ['*', '*'],
  strikethrough: ['~~', '~~']
}

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

tm.toggleToken = (type, state, startPoint, endPoint) => {
  let text
  let start = typeCharsMap[type][0]
  let end = typeCharsMap[type][1]

  if (state[type]) {
    text = cm.getLine(startPoint.line)
    start = text.slice(0, startPoint.ch)
    end = text.slice(startPoint.ch)

    if (type === 'bold') {
      start = start.replace(/(\*\*|__)(?![\s\S]*(\*\*|__))/, '')
      end = end.replace(/(\*\*|__)/, '')
    } else if (type === 'italic') {
      start = start.replace(/(\*|_)(?![\s\S]*(\*|_))/, '')
      end = end.replace(/(\*|_)/, '')
    } else if (type === 'strikethrough') {
      start = start.replace(/(\*\*|~~)(?![\s\S]*(\*\*|~~))/, '')
      end = end.replace(/(\*\*|~~)/, '')
    }
    cm.replaceRange(start + end, {
      line: startPoint.line,
      ch: 0
    }, {
      line: startPoint.line,
      ch: 99999999999999
    })

    if (type === 'bold' || type === 'strikethrough') {
      startPoint.ch -= 2
      if (startPoint !== endPoint) {
        endPoint.ch -= 2
      }
    } else if (type === 'italic') {
      startPoint.ch -= 1
      if (startPoint !== endPoint) {
        endPoint.ch -= 1
      }
    }
  } else {
    let selections = cm.getSelections()
    let args = []

    selections.forEach(selection => {
      let text = selection
      if (type === 'bold') {
        text = text.split('**').join('')
        text = text.split('__').join('')
      } else if (type === 'italic') {
        text = text.split('*').join('')
        text = text.split('_').join('')
      } else if (type === 'strikethrough') {
        text = text.split('~~').join('')
      }
      args.push(start + text + end)
    })

    cm.replaceSelections(args)

    // startPoint.ch += start.length
    // endPoint.ch = startPoint.ch + text.length
  }

  // cm.setSelections()
}

tm.toolbar = type => {
  cm.focus()

  let selectionsStart = cm.listSelections('start')
  selectionsStart.forEach((selection, i) => {
    let startPoint = selection.anchor
    let endPoint = selection.head

    let state = tm.getState(startPoint.head)
    tm.toggleToken(type, state, startPoint, endPoint)
    // console.log(type, state[type])
  })

  // let selections = cm.getSelections()
  // console.log(type, selections)
}

module.exports = tm
