let tm = {}
let cm

tm.setup = editor => {
  cm = editor
}

tm.bold = _ => {

}

tm.toolbar = type => {
  let somethingSelected = cm.somethingSelected()
  console.log(somethingSelected)

  console.log(cm.getCursor())

  // let selections = cm.getSelections()
  // console.log(type, selections)
}

module.exports = tm
