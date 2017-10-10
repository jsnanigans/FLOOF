/* global require,module */
'use strict'
var CodeMirror = require('codemirror')
require('codemirror/addon/edit/continuelist.js')
require('./codemirror/tablist')
require('codemirror/addon/display/fullscreen.js')
require('codemirror/mode/markdown/markdown.js')
require('codemirror/addon/mode/overlay.js')
require('codemirror/addon/display/placeholder.js')
require('codemirror/addon/selection/mark-selection.js')
require('codemirror/mode/gfm/gfm.js')
require('codemirror/mode/xml/xml.js')
var CodeMirrorSpellChecker = require('codemirror-spell-checker')
var marked = require('marked')

// Some variables
var isMac = /Mac/.test(navigator.platform)

// Mapping of actions that can be bound to keyboard shortcuts or toolbar buttons
var bindings = {
  'toggleBold': toggleBold,
  'toggleItalic': toggleItalic,
  'drawLink': drawLink,
  'toggleHeadingSmaller': toggleHeadingSmaller,
  'toggleHeadingBigger': toggleHeadingBigger,
  'drawImage': drawImage,
  'toggleBlockquote': toggleBlockquote,
  'toggleOrderedList': toggleOrderedList,
  'toggleUnorderedList': toggleUnorderedList,
  'toggleCodeBlock': toggleCodeBlock,
  'togglePreview': togglePreview,
  'toggleStrikethrough': toggleStrikethrough,
  'toggleHeading1': toggleHeading1,
  'toggleHeading2': toggleHeading2,
  'toggleHeading3': toggleHeading3,
  'cleanBlock': cleanBlock,
  'drawTable': drawTable,
  'drawHorizontalRule': drawHorizontalRule,
  'undo': undo,
  'redo': redo,
  'toggleSideBySide': toggleSideBySide,
  'toggleFullScreen': toggleFullScreen
}

var shortcuts = {
  'toggleBold': 'Cmd-B',
  'toggleItalic': 'Cmd-I',
  'drawLink': 'Cmd-K',
  'toggleHeadingSmaller': 'Cmd-H',
  'toggleHeadingBigger': 'Shift-Cmd-H',
  'cleanBlock': 'Cmd-E',
  'drawImage': 'Cmd-Alt-I',
  'toggleBlockquote': "Cmd-'",
  'toggleOrderedList': 'Cmd-Alt-L',
  'toggleUnorderedList': 'Cmd-L',
  'toggleCodeBlock': 'Cmd-Alt-C',
  'togglePreview': 'Cmd-P',
  'toggleSideBySide': 'F9',
  'toggleFullScreen': 'F11'
}

var getBindingName = function (f) {
  for (var key in bindings) {
    if (bindings[key] === f) {
      return key
    }
  }
  return null
}

var isMobile = function () {
  // var check = false;
  return false
}

/**
 * Fix shortcut. Mac use Command, others use Ctrl.
 */
function fixShortcut (name) {
  if (isMac) {
    name = name.replace('Ctrl', 'Cmd')
  } else {
    name = name.replace('Cmd', 'Ctrl')
  }
  return name
}

/**
 * Create icon element for toolbar.
 */
function createIcon (options, enableTooltips, shortcuts) {
  options = options || {}
  var el = document.createElement('a')
  enableTooltips = (enableTooltips === undefined) ? true : enableTooltips

  if (options.title && enableTooltips) {
    el.title = createTootlip(options.title, options.action, shortcuts)

    if (isMac) {
      el.title = el.title.replace('Ctrl', '⌘')
      el.title = el.title.replace('Alt', '⌥')
    }
  }

  el.tabIndex = -1
  el.className = options.className
  return el
}

function createSep () {
  var el = document.createElement('i')
  el.className = 'separator'
  el.innerHTML = '|'
  return el
}

function createTootlip (title, action, shortcuts) {
  var actionName
  var tooltip = title

  if (action) {
    actionName = getBindingName(action)
    if (shortcuts[actionName]) {
      tooltip += ' (' + fixShortcut(shortcuts[actionName]) + ')'
    }
  }

  return tooltip
}

/**
 * The state of CodeMirror at the given position.
 */
function getState (cm, pos) {
  pos = pos || cm.getCursor('start')
  var stat = cm.getTokenAt(pos)
  if (!stat.type) return {}

  var types = stat.type.split(' ')

  var ret = {}
  var data
  var text
  for (var i = 0; i < types.length; i++) {
    data = types[i]
    if (data === 'strong') {
      ret.bold = true
    } else if (data === 'variable-2') {
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

// Saved overflow setting
var savedOverflow = ''

/**
 * Toggle full screen of the editor.
 */
function toggleFullScreen (editor) {
  // Set fullscreen
  var cm = editor.codemirror
  cm.setOption('fullScreen', !cm.getOption('fullScreen'))

  // Prevent scrolling on body during fullscreen active
  if (cm.getOption('fullScreen')) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = savedOverflow
  }

  // Update toolbar class
  var wrap = cm.getWrapperElement()

  if (!/fullscreen/.test(wrap.previousSibling.className)) {
    wrap.previousSibling.className += ' fullscreen'
  } else {
    wrap.previousSibling.className = wrap.previousSibling.className.replace(/\s*fullscreen\b/, '')
  }

  // Update toolbar button
  var toolbarButton = editor.toolbarElements.fullscreen

  if (toolbarButton) {
    if (!/active/.test(toolbarButton.className)) {
      toolbarButton.className += ' active'
    } else {
      toolbarButton.className = toolbarButton.className.replace(/\s*active\s*/g, '')
    }
  }

  // Hide side by side if needed
  var sidebyside = cm.getWrapperElement().nextSibling
  if (/editor-preview-active-side/.test(sidebyside.className)) {
    toggleSideBySide(editor)
  }
}

/**
 * Action for toggling bold.
 */
function toggleBold (editor) {
  _toggleBlock(editor, 'bold', editor.options.blockStyles.bold)
}

/**
 * Action for toggling italic.
 */
function toggleItalic (editor) {
  _toggleBlock(editor, 'italic', editor.options.blockStyles.italic)
}

/**
 * Action for toggling strikethrough.
 */
function toggleStrikethrough (editor) {
  _toggleBlock(editor, 'strikethrough', '~~')
}

/**
 * Action for toggling code block.
 */
function toggleCodeBlock (editor) {
  var fenceCharsToInsert = editor.options.blockStyles.code

  function fencingLine (line) {
    /* return true, if this is a ``` or ~~~ line */
    if (typeof line !== 'object') {
      // throw "fencingLine() takes a 'line' object (not a line number, or line text).  Got: " + typeof line + ': ' + line
    }
    return line.styles && line.styles[2] && line.styles[2].indexOf('formatting-code-block') !== -1
  }

  function tokenState (token) {
    // base goes an extra level deep when mode backdrops are used, e.g. spellchecker on
    return token.state.base.base || token.state.base
  }

  function codeType (cm, lineNum, line, firstTok, lastTok) {
    /*
     * Return "single", "indented", "fenced" or false
     *
     * cm and lineNum are required.  Others are optional for efficiency
     *   To check in the middle of a line, pass in firstTok yourself.
     */
    line = line || cm.getLineHandle(lineNum)
    firstTok = firstTok || cm.getTokenAt({
      line: lineNum,
      ch: 1
    })
    lastTok = lastTok || (!!line.text && cm.getTokenAt({
      line: lineNum,
      ch: line.text.length - 1
    }))
    var types = firstTok.type ? firstTok.type.split(' ') : []
    if (lastTok && tokenState(lastTok).indentedCode) {
      // have to check last char, since first chars of first line aren"t marked as indented
      return 'indented'
    } else if (types.indexOf('comment') === -1) {
      // has to be after "indented" check, since first chars of first indented line aren"t marked as such
      return false
    } else if (tokenState(firstTok).fencedChars || tokenState(lastTok).fencedChars || fencingLine(line)) {
      return 'fenced'
    } else {
      return 'single'
    }
  }

  function insertFencingAtSelection (cm, curStart, curEnd, fenceCharsToInsert) {
    var startLineSel = curStart.line + 1
    var endLineSel = curEnd.line + 1
    var selMulti = curStart.line !== curEnd.line
    var replStart = fenceCharsToInsert + '\n'
    var replEnd = '\n' + fenceCharsToInsert

    if (selMulti) {
      endLineSel++
    }
    // handle last char including \n or not
    if (selMulti && curEnd.ch === 0) {
      replEnd = fenceCharsToInsert + '\n'
      endLineSel--
    }
    _replaceSelection(cm, false, [replStart, replEnd])
    cm.setSelection({
      line: startLineSel,
      ch: 0
    }, {
      line: endLineSel,
      ch: 0
    })
  }

  var cm = editor.codemirror
  var curStart = cm.getCursor('start')
  var curEnd = cm.getCursor('end')
  var tok = cm.getTokenAt({
    line: curStart.line,
    ch: curStart.ch || 1
  }) // avoid ch 0 which is a cursor pos but not token
  var line = cm.getLineHandle(curStart.line)
  var isCode = codeType(cm, curStart.line, line, tok)
  var blockStart, blockEnd, lineCount

  if (isCode === 'single') {
    // similar to some SimpleMDE _toggleBlock logic
    var start = line.text.slice(0, curStart.ch).replace('`', '')
    var end = line.text.slice(curStart.ch).replace('`', '')
    cm.replaceRange(start + end, {
      line: curStart.line,
      ch: 0
    }, {
      line: curStart.line,
      ch: 1e+14 - 1
    })
    curStart.ch--
    if (curStart !== curEnd) {
      curEnd.ch--
    }
    cm.setSelection(curStart, curEnd)
    cm.focus()
  } else if (isCode === 'fenced') {
    if (curStart.line !== curEnd.line || curStart.ch !== curEnd.ch) {
      // use selection

      // find the fenced line so we know what type it is (tilde, backticks, number of them)
      for (blockStart = curStart.line; blockStart >= 0; blockStart--) {
        line = cm.getLineHandle(blockStart)
        if (fencingLine(line)) {
          break
        }
      }
      var fencedTok = cm.getTokenAt({
        line: blockStart,
        ch: 1
      })
      var fenceChars = tokenState(fencedTok).fencedChars
      var startText, startLine
      var endText, endLine
      // check for selection going up against fenced lines, in which case we don't want to add more fencing
      if (fencingLine(cm.getLineHandle(curStart.line))) {
        startText = ''
        startLine = curStart.line
      } else if (fencingLine(cm.getLineHandle(curStart.line - 1))) {
        startText = ''
        startLine = curStart.line - 1
      } else {
        startText = fenceChars + '\n'
        startLine = curStart.line
      }
      if (fencingLine(cm.getLineHandle(curEnd.line))) {
        endText = ''
        endLine = curEnd.line
        if (curEnd.ch === 0) {
          endLine += 1
        }
      } else if (curEnd.ch !== 0 && fencingLine(cm.getLineHandle(curEnd.line + 1))) {
        endText = ''
        endLine = curEnd.line + 1
      } else {
        endText = fenceChars + '\n'
        endLine = curEnd.line + 1
      }
      if (curEnd.ch === 0) {
        // full last line selected, putting cursor at beginning of next
        endLine -= 1
      }
      cm.operation(function () {
        // end line first, so that line numbers don't change
        cm.replaceRange(endText, {
          line: endLine,
          ch: 0
        }, {
          line: endLine + (endText ? 0 : 1),
          ch: 0
        })
        cm.replaceRange(startText, {
          line: startLine,
          ch: 0
        }, {
          line: startLine + (startText ? 0 : 1),
          ch: 0
        })
      })
      cm.setSelection({
        line: startLine + (startText ? 1 : 0),
        ch: 0
      }, {
        line: endLine + (startText ? 1 : -1),
        ch: 0
      })
      cm.focus()
    } else {
      // no selection, search for ends of this fenced block
      var searchFrom = curStart.line
      if (fencingLine(cm.getLineHandle(curStart.line))) { // gets a little tricky if cursor is right on a fenced line
        if (codeType(cm, curStart.line + 1) === 'fenced') {
          blockStart = curStart.line
          searchFrom = curStart.line + 1 // for searching for "end"
        } else {
          blockEnd = curStart.line
          searchFrom = curStart.line - 1 // for searching for "start"
        }
      }
      if (blockStart === undefined) {
        for (blockStart = searchFrom; blockStart >= 0; blockStart--) {
          line = cm.getLineHandle(blockStart)
          if (fencingLine(line)) {
            break
          }
        }
      }
      if (blockEnd === undefined) {
        lineCount = cm.lineCount()
        for (blockEnd = searchFrom; blockEnd < lineCount; blockEnd++) {
          line = cm.getLineHandle(blockEnd)
          if (fencingLine(line)) {
            break
          }
        }
      }
      cm.operation(function () {
        cm.replaceRange('', {
          line: blockStart,
          ch: 0
        }, {
          line: blockStart + 1,
          ch: 0
        })
        cm.replaceRange('', {
          line: blockEnd - 1,
          ch: 0
        }, {
          line: blockEnd,
          ch: 0
        })
      })
      cm.focus()
    }
  } else if (isCode === 'indented') {
    if (curStart.line !== curEnd.line || curStart.ch !== curEnd.ch) {
      // use selection
      blockStart = curStart.line
      blockEnd = curEnd.line
      if (curEnd.ch === 0) {
        blockEnd--
      }
    } else {
      // no selection, search for ends of this indented block
      for (blockStart = curStart.line; blockStart >= 0; blockStart--) {
        line = cm.getLineHandle(blockStart)
        if (line.text.match(/^\s*$/)) {
          // empty or all whitespace - keep going
          continue
        } else {
          if (codeType(cm, blockStart, line) !== 'indented') {
            blockStart += 1
            break
          }
        }
      }
      lineCount = cm.lineCount()
      for (blockEnd = curStart.line; blockEnd < lineCount; blockEnd++) {
        line = cm.getLineHandle(blockEnd)
        if (line.text.match(/^\s*$/)) {
          // empty or all whitespace - keep going
          continue
        } else {
          if (codeType(cm, blockEnd, line) !== 'indented') {
            blockEnd -= 1
            break
          }
        }
      }
    }
    // if we are going to un-indent based on a selected set of lines, and the next line is indented too, we need to
    // insert a blank line so that the next line(s) continue to be indented code
    var nextLine = cm.getLineHandle(blockEnd + 1)
    var nextLineLastTok = nextLine && cm.getTokenAt({
      line: blockEnd + 1,
      ch: nextLine.text.length - 1
    })
    var nextLineIndented = nextLineLastTok && tokenState(nextLineLastTok).indentedCode
    if (nextLineIndented) {
      cm.replaceRange('\n', {
        line: blockEnd + 1,
        ch: 0
      })
    }

    for (var i = blockStart; i <= blockEnd; i++) {
      cm.indentLine(i, 'subtract') // TODO: this doesn't get tracked in the history, so can't be undone :(
    }
    cm.focus()
  } else {
    // insert code formatting
    var noSelAndStartingOfLIne = (curStart.line === curEnd.line && curStart.ch === curEnd.ch && curStart.ch === 0)
    var selMulti = curStart.line !== curEnd.line
    if (noSelAndStartingOfLIne || selMulti) {
      insertFencingAtSelection(cm, curStart, curEnd, fenceCharsToInsert)
    } else {
      _replaceSelection(cm, false, ['`', '`'])
    }
  }
}

/**
 * Action for toggling blockquote.
 */
function toggleBlockquote (editor) {
  var cm = editor.codemirror
  _toggleLine(cm, 'quote')
}

/**
 * Action for toggling heading size: normal -> h1 -> h2 -> h3 -> h4 -> h5 -> h6 -> normal
 */
function toggleHeadingSmaller (editor) {
  var cm = editor.codemirror
  _toggleHeading(cm, 'smaller')
}

/**
 * Action for toggling heading size: normal -> h6 -> h5 -> h4 -> h3 -> h2 -> h1 -> normal
 */
function toggleHeadingBigger (editor) {
  var cm = editor.codemirror
  _toggleHeading(cm, 'bigger')
}

/**
 * Action for toggling heading size 1
 */
function toggleHeading1 (editor) {
  var cm = editor.codemirror
  _toggleHeading(cm, undefined, 1)
}

/**
 * Action for toggling heading size 2
 */
function toggleHeading2 (editor) {
  var cm = editor.codemirror
  _toggleHeading(cm, undefined, 2)
}

/**
 * Action for toggling heading size 3
 */
function toggleHeading3 (editor) {
  var cm = editor.codemirror
  _toggleHeading(cm, undefined, 3)
}

/**
 * Action for toggling ul.
 */
function toggleUnorderedList (editor) {
  var cm = editor.codemirror
  _toggleLine(cm, 'unordered-list')
}

/**
 * Action for toggling ol.
 */
function toggleOrderedList (editor) {
  var cm = editor.codemirror
  _toggleLine(cm, 'ordered-list')
}

/**
 * Action for clean block (remove headline, list, blockquote code, markers)
 */
function cleanBlock (editor) {
  var cm = editor.codemirror
  _cleanBlock(cm)
}

/**
 * Action for drawing a link.
 */
function drawLink (editor) {
  var cm = editor.codemirror
  var stat = getState(cm)
  var options = editor.options
  var url = 'http://'
  if (options.promptURLs) {
    url = prompt(options.promptTexts.link)
    if (!url) {
      return false
    }
  }
  _replaceSelection(cm, stat.link, options.insertTexts.link, url)
}

/**
 * Action for drawing an img.
 */
function drawImage (editor) {
  var cm = editor.codemirror
  var stat = getState(cm)
  var options = editor.options
  var url = 'http://'
  if (options.promptURLs) {
    url = prompt(options.promptTexts.image)
    if (!url) {
      return false
    }
  }
  _replaceSelection(cm, stat.image, options.insertTexts.image, url)
}

/**
 * Action for drawing a table.
 */
function drawTable (editor) {
  var cm = editor.codemirror
  var stat = getState(cm)
  var options = editor.options
  _replaceSelection(cm, stat.table, options.insertTexts.table)
}

/**
 * Action for drawing a horizontal rule.
 */
function drawHorizontalRule (editor) {
  var cm = editor.codemirror
  var stat = getState(cm)
  var options = editor.options
  _replaceSelection(cm, stat.image, options.insertTexts.horizontalRule)
}

/**
 * Undo action.
 */
function undo (editor) {
  var cm = editor.codemirror
  cm.undo()
  cm.focus()
}

/**
 * Redo action.
 */
function redo (editor) {
  var cm = editor.codemirror
  cm.redo()
  cm.focus()
}

/**
 * Toggle side by side preview
 */
function toggleSideBySide (editor) {
  var cm = editor.codemirror
  var wrapper = cm.getWrapperElement()
  var preview = wrapper.nextSibling
  var toolbarButton = editor.toolbarElements['side-by-side']
  var useSideBySideListener = false
  if (/editor-preview-active-side/.test(preview.className)) {
    preview.className = preview.className.replace(
      /\s*editor-preview-active-side\s*/g, ''
    )
    toolbarButton.className = toolbarButton.className.replace(/\s*active\s*/g, '')
    wrapper.className = wrapper.className.replace(/\s*CodeMirror-sided\s*/g, ' ')
  } else {
    // When the preview button is clicked for the first time,
    // give some time for the transition from editor.css to fire and the view to slide from right to left,
    // instead of just appearing.

    setTimeout(function () {
      // if (!cm.getOption('fullScreen')) {
      //   toggleFullScreen(editor)
      // }
      preview.className += ' editor-preview-active-side'
    }, 1)
    toolbarButton.className += ' active'
    wrapper.className += ' CodeMirror-sided'
    useSideBySideListener = true
  }

  // Hide normal preview if active
  var previewNormal = wrapper.lastChild
  if (/editor-preview-active/.test(previewNormal.className)) {
    previewNormal.className = previewNormal.className.replace(
      /\s*editor-preview-active\s*/g, ''
    )
    var toolbar = editor.toolbarElements.preview
    var toolbarDiv = wrapper.previousSibling
    toolbar.className = toolbar.className.replace(/\s*active\s*/g, '')
    toolbarDiv.className = toolbarDiv.className.replace(/\s*disabled-for-preview*/g, '')
  }

  var sideBySideRenderingFunction = function () {
    preview.innerHTML = editor.options.previewRender(editor.value(), preview)
  }

  if (!cm.sideBySideRenderingFunction) {
    cm.sideBySideRenderingFunction = sideBySideRenderingFunction
  }

  if (useSideBySideListener) {
    preview.innerHTML = editor.options.previewRender(editor.value(), preview)
    cm.on('update', cm.sideBySideRenderingFunction)
  } else {
    cm.off('update', cm.sideBySideRenderingFunction)
  }

  // Refresh to fix selection being off (#309)
  cm.refresh()
}

/**
 * Preview action.
 */
function togglePreview (editor) {
  var cm = editor.codemirror
  var wrapper = cm.getWrapperElement()
  var toolbarDiv = wrapper.previousSibling
  var toolbar = editor.options.toolbar ? editor.toolbarElements.preview : false
  var preview = wrapper.lastChild
  if (!preview || !/editor-preview/.test(preview.className)) {
    preview = document.createElement('div')
    preview.className = 'editor-preview'
    wrapper.appendChild(preview)
  }
  if (/editor-preview-active/.test(preview.className)) {
    preview.className = preview.className.replace(
      /\s*editor-preview-active\s*/g, ''
    )
    if (toolbar) {
      toolbar.className = toolbar.className.replace(/\s*active\s*/g, '')
      toolbarDiv.className = toolbarDiv.className.replace(/\s*disabled-for-preview*/g, '')
    }
  } else {
    // When the preview button is clicked for the first time,
    // give some time for the transition from editor.css to fire and the view to slide from right to left,
    // instead of just appearing.
    setTimeout(function () {
      preview.className += ' editor-preview-active'
    }, 1)
    if (toolbar) {
      toolbar.className += ' active'
      toolbarDiv.className += ' disabled-for-preview'
    }
  }
  preview.innerHTML = editor.options.previewRender(editor.value(), preview)

  // Turn off side by side if needed
  var sidebyside = cm.getWrapperElement().nextSibling
  if (/editor-preview-active-side/.test(sidebyside.className)) {
    toggleSideBySide(editor)
  }
}

function _replaceSelection (cm, active, startEnd, url) {
  if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)) {
    return
  }

  var text
  var start = startEnd[0]
  var end = startEnd[1]
  var startPoint = cm.getCursor('start')
  var endPoint = cm.getCursor('end')
  if (url) {
    end = end.replace('#url#', url)
  }
  if (active) {
    text = cm.getLine(startPoint.line)
    start = text.slice(0, startPoint.ch)
    end = text.slice(startPoint.ch)
    cm.replaceRange(start + end, {
      line: startPoint.line,
      ch: 0
    })
  } else {
    text = cm.getSelection()
    cm.replaceSelection(start + text + end)

    startPoint.ch += start.length
    if (startPoint !== endPoint) {
      endPoint.ch += start.length
    }
  }
  cm.setSelection(startPoint, endPoint)
  cm.focus()
}

function _toggleHeading (cm, direction, size) {
  if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)) {
    return
  }

  var startPoint = cm.getCursor('start')
  var endPoint = cm.getCursor('end')
  for (var i = startPoint.line; i <= endPoint.line; i++) {
    (function (i) {
      var text = cm.getLine(i)
      var currHeadingLevel = text.search(/[^#]/)

      if (direction !== undefined) {
        if (currHeadingLevel <= 0) {
          if (direction === 'bigger') {
            text = '###### ' + text
          } else {
            text = '# ' + text
          }
        } else if (currHeadingLevel === 6 && direction === 'smaller') {
          text = text.substr(7)
        } else if (currHeadingLevel === 1 && direction === 'bigger') {
          text = text.substr(2)
        } else {
          if (direction === 'bigger') {
            text = text.substr(1)
          } else {
            text = '#' + text
          }
        }
      } else {
        if (size === 1) {
          if (currHeadingLevel <= 0) {
            text = '# ' + text
          } else if (currHeadingLevel === size) {
            text = text.substr(currHeadingLevel + 1)
          } else {
            text = '# ' + text.substr(currHeadingLevel + 1)
          }
        } else if (size === 2) {
          if (currHeadingLevel <= 0) {
            text = '## ' + text
          } else if (currHeadingLevel === size) {
            text = text.substr(currHeadingLevel + 1)
          } else {
            text = '## ' + text.substr(currHeadingLevel + 1)
          }
        } else {
          if (currHeadingLevel <= 0) {
            text = '### ' + text
          } else if (currHeadingLevel === size) {
            text = text.substr(currHeadingLevel + 1)
          } else {
            text = '### ' + text.substr(currHeadingLevel + 1)
          }
        }
      }

      cm.replaceRange(text, {
        line: i,
        ch: 0
      }, {
        line: i,
        ch: 99999999999999
      })
    })(i)
  }
  cm.focus()
}

function _toggleLine (cm, name) {
  if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)) {
    return
  }

  var stat = getState(cm)
  var startPoint = cm.getCursor('start')
  var endPoint = cm.getCursor('end')
  var repl = {
    'quote': /^(\s*)>\s+/,
    'unordered-list': /^(\s*)(\*|-|\+)\s+/,
    'ordered-list': /^(\s*)\d+\.\s+/
  }
  var map = {
    'quote': '> ',
    'unordered-list': '* ',
    'ordered-list': '1. '
  }
  for (var i = startPoint.line; i <= endPoint.line; i++) {
    (function (i) {
      var text = cm.getLine(i)
      if (stat[name]) {
        text = text.replace(repl[name], '$1')
      } else {
        text = map[name] + text
      }
      cm.replaceRange(text, {
        line: i,
        ch: 0
      }, {
        line: i,
        ch: 99999999999999
      })
    })(i)
  }
  cm.focus()
}

function _toggleBlock (editor, type, startChars, endChars) {
  if (/editor-preview-active/.test(editor.codemirror.getWrapperElement().lastChild.className)) {
    return
  }

  endChars = (typeof endChars === 'undefined') ? startChars : endChars
  var cm = editor.codemirror
  var stat = getState(cm)

  var text
  var start = startChars
  var end = endChars

  var startPoint = cm.getCursor('start')
  var endPoint = cm.getCursor('end')

  if (stat[type]) {
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
    text = cm.getSelection()
    if (type === 'bold') {
      text = text.split('**').join('')
      text = text.split('__').join('')
    } else if (type === 'italic') {
      text = text.split('*').join('')
      text = text.split('_').join('')
    } else if (type === 'strikethrough') {
      text = text.split('~~').join('')
    }
    cm.replaceSelection(start + text + end)

    startPoint.ch += startChars.length
    endPoint.ch = startPoint.ch + text.length
  }

  cm.setSelection(startPoint, endPoint)
  cm.focus()
}

function _cleanBlock (cm) {
  if (/editor-preview-active/.test(cm.getWrapperElement().lastChild.className)) {
    return
  }

  var startPoint = cm.getCursor('start')
  var endPoint = cm.getCursor('end')
  var text

  for (var line = startPoint.line; line <= endPoint.line; line++) {
    text = cm.getLine(line)
    text = text.replace(/^[ ]*([# ]+|\*|-|[> ]+|[0-9]+(.|\)))[ ]*/, '')

    cm.replaceRange(text, {
      line: line,
      ch: 0
    }, {
      line: line,
      ch: 99999999999999
    })
  }
}

// Merge the properties of one object into another.
function _mergeProperties (target, source) {
  for (var property in source) {
    if (source.hasOwnProperty(property)) {
      if (source[property] instanceof Array) {
        target[property] = source[property].concat(target[property] instanceof Array ? target[property] : [])
      } else if (
        source[property] !== null &&
        typeof source[property] === 'object' &&
        source[property].constructor === Object
      ) {
        target[property] = _mergeProperties(target[property] || {}, source[property])
      } else {
        target[property] = source[property]
      }
    }
  }

  return target
}

// Merge an arbitrary number of objects into one.
function extend (target) {
  for (var i = 1; i < arguments.length; i++) {
    target = _mergeProperties(target, arguments[i])
  }

  return target
}

/* The right word count in respect for CJK. */
function wordCount (data) {
  var pattern = /[a-zA-Z0-9_\u0392-\u03c9\u0410-\u04F9]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g
  var m = data.match(pattern)
  var count = 0
  if (m === null) return count
  for (var i = 0; i < m.length; i++) {
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    } else {
      count += 1
    }
  }
  return count
}

var toolbarBuiltInButtons = {
  'bold': {
    name: 'bold',
    action: toggleBold,
    className: 'fa fa-bold',
    title: 'Bold',
    default: true
  },
  'italic': {
    name: 'italic',
    action: toggleItalic,
    className: 'fa fa-italic',
    title: 'Italic',
    default: true
  },
  'strikethrough': {
    name: 'strikethrough',
    action: toggleStrikethrough,
    className: 'fa fa-strikethrough',
    title: 'Strikethrough'
  },
  'heading': {
    name: 'heading',
    action: toggleHeadingSmaller,
    className: 'fa fa-header',
    title: 'Heading',
    default: true
  },
  'heading-smaller': {
    name: 'heading-smaller',
    action: toggleHeadingSmaller,
    className: 'fa fa-header fa-header-x fa-header-smaller',
    title: 'Smaller Heading'
  },
  'heading-bigger': {
    name: 'heading-bigger',
    action: toggleHeadingBigger,
    className: 'fa fa-header fa-header-x fa-header-bigger',
    title: 'Bigger Heading'
  },
  'heading-1': {
    name: 'heading-1',
    action: toggleHeading1,
    className: 'fa fa-header fa-header-x fa-header-1',
    title: 'Big Heading'
  },
  'heading-2': {
    name: 'heading-2',
    action: toggleHeading2,
    className: 'fa fa-header fa-header-x fa-header-2',
    title: 'Medium Heading'
  },
  'heading-3': {
    name: 'heading-3',
    action: toggleHeading3,
    className: 'fa fa-header fa-header-x fa-header-3',
    title: 'Small Heading'
  },
  'separator-1': {
    name: 'separator-1'
  },
  'code': {
    name: 'code',
    action: toggleCodeBlock,
    className: 'fa fa-code',
    title: 'Code'
  },
  'quote': {
    name: 'quote',
    action: toggleBlockquote,
    className: 'fa fa-quote-left',
    title: 'Quote',
    default: true
  },
  'unordered-list': {
    name: 'unordered-list',
    action: toggleUnorderedList,
    className: 'fa fa-list-ul',
    title: 'Generic List',
    default: true
  },
  'ordered-list': {
    name: 'ordered-list',
    action: toggleOrderedList,
    className: 'fa fa-list-ol',
    title: 'Numbered List',
    default: true
  },
  'clean-block': {
    name: 'clean-block',
    action: cleanBlock,
    className: 'fa fa-eraser fa-clean-block',
    title: 'Clean block'
  },
  'separator-2': {
    name: 'separator-2'
  },
  'link': {
    name: 'link',
    action: drawLink,
    className: 'fa fa-link',
    title: 'Create Link',
    default: true
  },
  'image': {
    name: 'image',
    action: drawImage,
    className: 'fa fa-picture-o',
    title: 'Insert Image',
    default: true
  },
  'table': {
    name: 'table',
    action: drawTable,
    className: 'fa fa-table',
    title: 'Insert Table'
  },
  'horizontal-rule': {
    name: 'horizontal-rule',
    action: drawHorizontalRule,
    className: 'fa fa-minus',
    title: 'Insert Horizontal Line'
  },
  'separator-3': {
    name: 'separator-3'
  },
  'preview': {
    name: 'preview',
    action: togglePreview,
    className: 'fa fa-eye no-disable',
    title: 'Toggle Preview',
    default: true
  },
  'side-by-side': {
    name: 'side-by-side',
    action: toggleSideBySide,
    className: 'fa fa-columns no-disable no-mobile',
    title: 'Toggle Side by Side',
    default: true
  },
  'fullscreen': {
    name: 'fullscreen',
    action: toggleFullScreen,
    className: 'fa fa-arrows-alt no-disable no-mobile',
    title: 'Toggle Fullscreen',
    default: true
  },
  'separator-4': {
    name: 'separator-4'
  },
  'guide': {
    name: 'guide',
    action: 'https://simplemde.com/markdown-guide',
    className: 'fa fa-question-circle',
    title: 'Markdown Guide',
    default: true
  },
  'separator-5': {
    name: 'separator-5'
  },
  'undo': {
    name: 'undo',
    action: undo,
    className: 'fa fa-undo no-disable',
    title: 'Undo'
  },
  'redo': {
    name: 'redo',
    action: redo,
    className: 'fa fa-repeat no-disable',
    title: 'Redo'
  }
}

var insertTexts = {
  link: ['[', '](#url#)'],
  image: ['![](', '#url#)'],
  table: ['', '\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |\n\n'],
  horizontalRule: ['', '\n\n-----\n\n']
}

var promptTexts = {
  link: 'URL for the link:',
  image: 'URL of the image:'
}

var blockStyles = {
  'bold': '**',
  'code': '```',
  'italic': '*'
}

/**
 * Interface of SimpleMDE.
 */
function SimpleMDE (options) {
  // Handle options parameter
  options = options || {}

  // Used later to refer to it"s parent
  options.parent = this

  // Check if Font Awesome needs to be auto downloaded
  var autoDownloadFA = true

  if (options.autoDownloadFontAwesome === false) {
    autoDownloadFA = false
  }

  if (options.autoDownloadFontAwesome !== true) {
    var styleSheets = document.styleSheets
    for (var i = 0; i < styleSheets.length; i++) {
      if (!styleSheets[i].href) {
        continue
      }

      if (styleSheets[i].href.indexOf('//maxcdn.bootstrapcdn.com/font-awesome/') > -1) {
        autoDownloadFA = false
      }
    }
  }

  if (autoDownloadFA) {
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css'
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  // Find the textarea to use
  if (options.element) {
    this.element = options.element
  } else if (options.element === null) {
    // This means that the element option was specified, but no element was found
    console.log('SimpleMDE: Error. No element was found.')
    return
  }

  // Handle toolbar
  if (options.toolbar === undefined) {
    // Initialize
    options.toolbar = []

    // Loop over the built in buttons, to get the preferred order
    for (var key in toolbarBuiltInButtons) {
      if (toolbarBuiltInButtons.hasOwnProperty(key)) {
        if (key.indexOf('separator-') !== -1) {
          options.toolbar.push('|')
        }

        if (toolbarBuiltInButtons[key].default === true || (options.showIcons && options.showIcons.constructor === Array && options.showIcons.indexOf(key) !== -1)) {
          options.toolbar.push(key)
        }
      }
    }
  }

  // Handle status bar
  if (!options.hasOwnProperty('status')) {
    options.status = ['autosave', 'lines', 'words', 'cursor']
  }

  // Add default preview rendering function
  if (!options.previewRender) {
    options.previewRender = function (plainText) {
      // Note: "this" refers to the options object
      return this.parent.markdown(plainText)
    }
  }

  // Set default options for parsing config
  options.parsingConfig = extend({
    highlightFormatting: true // needed for toggleCodeBlock to detect types of code
  }, options.parsingConfig || {})

  // Merging the insertTexts, with the given options
  options.insertTexts = extend({}, insertTexts, options.insertTexts || {})

  // Merging the promptTexts, with the given options
  options.promptTexts = promptTexts

  // Merging the blockStyles, with the given options
  options.blockStyles = extend({}, blockStyles, options.blockStyles || {})

  // Merging the shortcuts, with the given options
  options.shortcuts = extend({}, shortcuts, options.shortcuts || {})

  // Change unique_id to uniqueId for backwards compatibility
  if (options.autosave !== undefined && options.autosave.unique_id !== undefined && options.autosave.unique_id !== '') {
    options.autosave.uniqueId = options.autosave.unique_id
  }

  // Update this options
  this.options = options

  // Auto render
  this.render()

  // The codemirror component is only available after rendering
  // so, the setter for the initialValue can only run after
  // the element has been rendered
  if (options.initialValue && (!this.options.autosave || this.options.autosave.foundSavedValue !== true)) {
    this.value(options.initialValue)
  }
}

/**
 * Default markdown render.
 */
SimpleMDE.prototype.markdown = function (text) {
  if (marked) {
    // Initialize
    var markedOptions = {}

    // Update options
    if (this.options && this.options.renderingConfig && this.options.renderingConfig.singleLineBreaks === false) {
      markedOptions.breaks = false
    } else {
      markedOptions.breaks = true
    }

    if (this.options && this.options.renderingConfig && this.options.renderingConfig.codeSyntaxHighlighting === true && window.hljs) {
      markedOptions.highlight = function (code) {
        return window.hljs.highlightAuto(code).value
      }
    }

    // Set options
    marked.setOptions(markedOptions)

    // Return
    return marked(text)
  }
}

/**
 * Render editor to the given element.
 */
SimpleMDE.prototype.render = function (el) {
  if (!el) {
    el = this.element || document.getElementsByTagName('textarea')[0]
  }

  if (this._rendered && this._rendered === el) {
    // Already rendered.
    return
  }

  this.element = el
  var options = this.options

  var self = this
  var keyMaps = {}

  for (var key in options.shortcuts) {
    // null stands for "do not bind this command"
    if (options.shortcuts[key] !== null && bindings[key] !== null) {
      (function (key) {
        keyMaps[fixShortcut(options.shortcuts[key])] = function () {
          bindings[key](self)
        }
      })(key)
    }
  }

  keyMaps['Enter'] = 'newlineAndIndentContinueMarkdownList'
  keyMaps['Tab'] = 'tabAndIndentMarkdownList'
  keyMaps['Shift-Tab'] = 'shiftTabAndUnindentMarkdownList'
  keyMaps['Esc'] = function (cm) {
    if (cm.getOption('fullScreen')) toggleFullScreen(self)
  }

  document.addEventListener('keydown', function (e) {
    e = e || window.event

    if (e.keyCode === 27) {
      if (self.codemirror.getOption('fullScreen')) toggleFullScreen(self)
    }
  }, false)

  var mode, backdrop
  if (options.spellChecker !== false) {
    mode = 'spell-checker'
    backdrop = options.parsingConfig
    backdrop.name = 'gfm'
    backdrop.gitHubSpice = false

    CodeMirrorSpellChecker({
      codeMirrorInstance: CodeMirror
    })
  } else {
    mode = options.parsingConfig
    mode.name = 'gfm'
    mode.gitHubSpice = false
  }

  this.codemirror = CodeMirror.fromTextArea(el, {
    mode: mode,
    backdrop: backdrop,
    theme: 'paper',
    tabSize: (options.tabSize !== undefined) ? options.tabSize : 2,
    indentUnit: (options.tabSize !== undefined) ? options.tabSize : 2,
    indentWithTabs: options.indentWithTabs !== false,
    lineNumbers: false,
    autofocus: (options.autofocus === true),
    extraKeys: keyMaps,
    lineWrapping: options.lineWrapping !== false,
    allowDropFileTypes: ['text/plain'],
    placeholder: options.placeholder || el.getAttribute('placeholder') || '',
    styleSelectedText: (options.styleSelectedText !== undefined) ? options.styleSelectedText : true
  })

  if (options.forceSync === true) {
    var cm = this.codemirror
    cm.on('change', function () {
      cm.save()
    })
  }

  this.gui = {}

  if (options.toolbar !== false) {
    this.gui.toolbar = this.createToolbar()
  }
  if (options.status !== false) {
    this.gui.statusbar = this.createStatusbar()
  }
  if (options.autosave !== undefined && options.autosave.enabled === true) {
    this.autosave()
  }

  this.gui.sideBySide = this.createSideBySide()

  this._rendered = this.element

  // Fixes CodeMirror bug (#344)
  var tempCM = this.codemirror
  setTimeout(function () {
    tempCM.refresh()
  }, 0)
}

// Safari, in Private Browsing Mode, looks like it supports localStorage but all calls to setItem throw QuotaExceededError. We're going to detect this and set a variable accordingly.
function isLocalStorageAvailable () {
  if (typeof localStorage === 'object') {
    try {
      localStorage.setItem('smde_localStorage', 1)
      localStorage.removeItem('smde_localStorage')
    } catch (e) {
      return false
    }
  } else {
    return false
  }

  return true
}

SimpleMDE.prototype.autosave = function () {
  if (isLocalStorageAvailable()) {
    var simplemde = this

    if (this.options.autosave.uniqueId === undefined || this.options.autosave.uniqueId === '') {
      console.log('SimpleMDE: You must set a uniqueId to use the autosave feature')
      return
    }

    if (simplemde.element.form !== null && simplemde.element.form !== undefined) {
      simplemde.element.form.addEventListener('submit', function () {
        localStorage.removeItem('smde_' + simplemde.options.autosave.uniqueId)
      })
    }

    if (this.options.autosave.loaded !== true) {
      if (typeof localStorage.getItem('smde_' + this.options.autosave.uniqueId) === 'string' && localStorage.getItem('smde_' + this.options.autosave.uniqueId) !== '') {
        this.codemirror.setValue(localStorage.getItem('smde_' + this.options.autosave.uniqueId))
        this.options.autosave.foundSavedValue = true
      }

      this.options.autosave.loaded = true
    }

    localStorage.setItem('smde_' + this.options.autosave.uniqueId, simplemde.value())

    var el = document.getElementById('autosaved')
    if (el !== null && el !== undefined && el !== '') {
      var d = new Date()
      var hh = d.getHours()
      var m = d.getMinutes()
      var dd = 'am'
      var h = hh
      if (h >= 12) {
        h = hh - 12
        dd = 'pm'
      }
      if (h === 0) {
        h = 12
      }
      m = m < 10 ? '0' + m : m

      el.innerHTML = 'Autosaved: ' + h + ':' + m + ' ' + dd
    }

    this.autosaveTimeoutId = setTimeout(function () {
      simplemde.autosave()
    }, this.options.autosave.delay || 10000)
  } else {
    console.log('SimpleMDE: localStorage not available, cannot autosave')
  }
}

SimpleMDE.prototype.clearAutosavedValue = function () {
  if (isLocalStorageAvailable()) {
    if (this.options.autosave === undefined || this.options.autosave.uniqueId === undefined || this.options.autosave.uniqueId === '') {
      console.log('SimpleMDE: You must set a uniqueId to clear the autosave value')
      return
    }

    localStorage.removeItem('smde_' + this.options.autosave.uniqueId)
  } else {
    console.log('SimpleMDE: localStorage not available, cannot autosave')
  }
}

SimpleMDE.prototype.createSideBySide = function () {
  var cm = this.codemirror
  var wrapper = cm.getWrapperElement()
  var preview = wrapper.nextSibling

  if (!preview || !/editor-preview-side/.test(preview.className)) {
    preview = document.createElement('div')
    preview.className = 'editor-preview-side'
    wrapper.parentNode.insertBefore(preview, wrapper.nextSibling)
  }

  // Syncs scroll  editor -> preview
  var cScroll = false
  var pScroll = false
  cm.on('scroll', function (v) {
    if (cScroll) {
      cScroll = false
      return
    }
    pScroll = true
    var height = v.getScrollInfo().height - v.getScrollInfo().clientHeight
    var ratio = parseFloat(v.getScrollInfo().top) / height
    var move = (preview.scrollHeight - preview.clientHeight) * ratio
    preview.scrollTop = move
  })

  // Syncs scroll  preview -> editor
  preview.onscroll = function () {
    if (pScroll) {
      pScroll = false
      return
    }
    cScroll = true
    var height = preview.scrollHeight - preview.clientHeight
    var ratio = parseFloat(preview.scrollTop) / height
    var move = (cm.getScrollInfo().height - cm.getScrollInfo().clientHeight) * ratio
    cm.scrollTo(0, move)
  }
  return preview
}

SimpleMDE.prototype.createToolbar = function (items) {
  items = items || this.options.toolbar

  if (!items || items.length === 0) {
    return
  }
  var i
  for (i = 0; i < items.length; i++) {
    if (toolbarBuiltInButtons[items[i]] !== undefined) {
      items[i] = toolbarBuiltInButtons[items[i]]
    }
  }

  var bar = document.createElement('div')
  bar.className = 'editor-toolbar'

  var self = this

  var toolbarData = {}
  self.toolbar = items

  for (i = 0; i < items.length; i++) {
    if (items[i].name === 'guide' && self.options.toolbarGuideIcon === false) {
      continue
    }

    if (self.options.hideIcons && self.options.hideIcons.indexOf(items[i].name) !== -1) {
      continue
    }

    // Fullscreen does not work well on mobile devices (even tablets)
    // In the future, hopefully this can be resolved
    if ((items[i].name === 'fullscreen' || items[i].name === 'side-by-side') && isMobile()) {
      continue
    }

    // Don't include trailing separators
    if (items[i] === '|') {
      var nonSeparatorIconsFollow = false

      for (var x = (i + 1); x < items.length; x++) {
        if (items[x] !== '|' && (!self.options.hideIcons || self.options.hideIcons.indexOf(items[x].name) === -1)) {
          nonSeparatorIconsFollow = true
        }
      }

      if (!nonSeparatorIconsFollow) {
        continue
      }
    }

    // Create the icon and append to the toolbar
    (function (item) {
      var el
      if (item === '|') {
        el = createSep()
      } else {
        el = createIcon(item, self.options.toolbarTips, self.options.shortcuts)
      }

      // bind events, special for info
      if (item.action) {
        if (typeof item.action === 'function') {
          el.onclick = function (e) {
            e.preventDefault()
            item.action(self)
          }
        } else if (typeof item.action === 'string') {
          el.href = item.action
          el.target = '_blank'
        }
      }

      toolbarData[item.name || item] = el
      bar.appendChild(el)
    })(items[i])
  }

  self.toolbarElements = toolbarData

  var cm = this.codemirror
  cm.on('cursorActivity', function () {
    var stat = getState(cm)

    for (var key in toolbarData) {
      (function (key) {
        var el = toolbarData[key]
        if (stat[key]) {
          el.className += ' active'
        } else if (key !== 'fullscreen' && key !== 'side-by-side') {
          el.className = el.className.replace(/\s*active\s*/g, '')
        }
      })(key)
    }
  })

  var cmWrapper = cm.getWrapperElement()
  cmWrapper.parentNode.insertBefore(bar, cmWrapper)
  return bar
}

SimpleMDE.prototype.createStatusbar = function (status) {
  // Initialize
  status = status || this.options.status
  var options = this.options
  var cm = this.codemirror

  // Make sure the status variable is valid
  if (!status || status.length === 0) {
    return
  }

  // Set up the built-in items
  var items = []
  var i, onUpdate, defaultValue

  for (i = 0; i < status.length; i++) {
    // Reset some values
    onUpdate = undefined
    defaultValue = undefined

    // Handle if custom or not
    if (typeof status[i] === 'object') {
      items.push({
        className: status[i].className,
        defaultValue: status[i].defaultValue,
        onUpdate: status[i].onUpdate
      })
    } else {
      var name = status[i]

      if (name === 'words') {
        defaultValue = function (el) {
          el.innerHTML = wordCount(cm.getValue())
        }
        onUpdate = function (el) {
          el.innerHTML = wordCount(cm.getValue())
        }
      } else if (name === 'lines') {
        defaultValue = function (el) {
          el.innerHTML = cm.lineCount()
        }
        onUpdate = function (el) {
          el.innerHTML = cm.lineCount()
        }
      } else if (name === 'cursor') {
        defaultValue = function (el) {
          el.innerHTML = '0:0'
        }
        onUpdate = function (el) {
          var pos = cm.getCursor()
          el.innerHTML = pos.line + ':' + pos.ch
        }
      } else if (name === 'autosave') {
        defaultValue = function (el) {
          if (options.autosave !== undefined && options.autosave.enabled === true) {
            el.setAttribute('id', 'autosaved')
          }
        }
      }

      items.push({
        className: name,
        defaultValue: defaultValue,
        onUpdate: onUpdate
      })
    }
  }

  // Create element for the status bar
  var bar = document.createElement('div')
  bar.className = 'editor-statusbar'

  // Create a new span for each item
  for (i = 0; i < items.length; i++) {
    // Store in temporary variable
    var item = items[i]

    // Create span element
    var el = document.createElement('span')
    el.className = item.className

    // Ensure the defaultValue is a function
    if (typeof item.defaultValue === 'function') {
      item.defaultValue(el)
    }

    // Ensure the onUpdate is a function
    if (typeof item.onUpdate === 'function') {
      // Create a closure around the span of the current action, then execute the onUpdate handler
      this.codemirror.on('update', (function (el, item) {
        return function () {
          item.onUpdate(el)
        }
      }(el, item)))
    }

    // Append the item to the status bar
    bar.appendChild(el)
  }

  // Insert the status bar into the DOM
  var cmWrapper = this.codemirror.getWrapperElement()
  cmWrapper.parentNode.insertBefore(bar, cmWrapper.nextSibling)
  return bar
}

/**
 * Get or set the text content.
 */
SimpleMDE.prototype.value = function (val) {
  if (val === undefined) {
    return this.codemirror.getValue()
  } else {
    this.codemirror.getDoc().setValue(val)
    return this
  }
}

/**
 * Bind static methods for exports.
 */
SimpleMDE.toggleBold = toggleBold
SimpleMDE.toggleItalic = toggleItalic
SimpleMDE.toggleStrikethrough = toggleStrikethrough
SimpleMDE.toggleBlockquote = toggleBlockquote
SimpleMDE.toggleHeadingSmaller = toggleHeadingSmaller
SimpleMDE.toggleHeadingBigger = toggleHeadingBigger
SimpleMDE.toggleHeading1 = toggleHeading1
SimpleMDE.toggleHeading2 = toggleHeading2
SimpleMDE.toggleHeading3 = toggleHeading3
SimpleMDE.toggleCodeBlock = toggleCodeBlock
SimpleMDE.toggleUnorderedList = toggleUnorderedList
SimpleMDE.toggleOrderedList = toggleOrderedList
SimpleMDE.cleanBlock = cleanBlock
SimpleMDE.drawLink = drawLink
SimpleMDE.drawImage = drawImage
SimpleMDE.drawTable = drawTable
SimpleMDE.drawHorizontalRule = drawHorizontalRule
SimpleMDE.undo = undo
SimpleMDE.redo = redo
SimpleMDE.togglePreview = togglePreview
SimpleMDE.toggleSideBySide = toggleSideBySide
SimpleMDE.toggleFullScreen = toggleFullScreen

/**
 * Bind instance methods for exports.
 */
SimpleMDE.prototype.toggleBold = function () {
  toggleBold(this)
}
SimpleMDE.prototype.toggleItalic = function () {
  toggleItalic(this)
}
SimpleMDE.prototype.toggleStrikethrough = function () {
  toggleStrikethrough(this)
}
SimpleMDE.prototype.toggleBlockquote = function () {
  toggleBlockquote(this)
}
SimpleMDE.prototype.toggleHeadingSmaller = function () {
  toggleHeadingSmaller(this)
}
SimpleMDE.prototype.toggleHeadingBigger = function () {
  toggleHeadingBigger(this)
}
SimpleMDE.prototype.toggleHeading1 = function () {
  toggleHeading1(this)
}
SimpleMDE.prototype.toggleHeading2 = function () {
  toggleHeading2(this)
}
SimpleMDE.prototype.toggleHeading3 = function () {
  toggleHeading3(this)
}
SimpleMDE.prototype.toggleCodeBlock = function () {
  toggleCodeBlock(this)
}
SimpleMDE.prototype.toggleUnorderedList = function () {
  toggleUnorderedList(this)
}
SimpleMDE.prototype.toggleOrderedList = function () {
  toggleOrderedList(this)
}
SimpleMDE.prototype.cleanBlock = function () {
  cleanBlock(this)
}
SimpleMDE.prototype.drawLink = function () {
  drawLink(this)
}
SimpleMDE.prototype.drawImage = function () {
  drawImage(this)
}
SimpleMDE.prototype.drawTable = function () {
  drawTable(this)
}
SimpleMDE.prototype.drawHorizontalRule = function () {
  drawHorizontalRule(this)
}
SimpleMDE.prototype.undo = function () {
  undo(this)
}
SimpleMDE.prototype.redo = function () {
  redo(this)
}
SimpleMDE.prototype.togglePreview = function () {
  togglePreview(this)
}
SimpleMDE.prototype.toggleSideBySide = function () {
  toggleSideBySide(this)
}
SimpleMDE.prototype.toggleFullScreen = function () {
  toggleFullScreen(this)
}

SimpleMDE.prototype.isPreviewActive = function () {
  var cm = this.codemirror
  var wrapper = cm.getWrapperElement()
  var preview = wrapper.lastChild

  return /editor-preview-active/.test(preview.className)
}

SimpleMDE.prototype.isSideBySideActive = function () {
  var cm = this.codemirror
  var wrapper = cm.getWrapperElement()
  var preview = wrapper.nextSibling

  return /editor-preview-active-side/.test(preview.className)
}

SimpleMDE.prototype.isFullscreenActive = function () {
  var cm = this.codemirror

  return cm.getOption('fullScreen')
}

SimpleMDE.prototype.getState = function () {
  var cm = this.codemirror

  return getState(cm)
}

SimpleMDE.prototype.toTextArea = function () {
  var cm = this.codemirror
  var wrapper = cm.getWrapperElement()

  if (wrapper.parentNode) {
    if (this.gui.toolbar) {
      wrapper.parentNode.removeChild(this.gui.toolbar)
    }
    if (this.gui.statusbar) {
      wrapper.parentNode.removeChild(this.gui.statusbar)
    }
    if (this.gui.sideBySide) {
      wrapper.parentNode.removeChild(this.gui.sideBySide)
    }
  }

  cm.toTextArea()

  if (this.autosaveTimeoutId) {
    clearTimeout(this.autosaveTimeoutId)
    this.autosaveTimeoutId = undefined
    this.clearAutosavedValue()
  }
}

export default SimpleMDE
