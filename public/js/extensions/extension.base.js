export default class ExtensionBase extends Autodesk.Viewing.Extension {

  constructor(viewer, options) {
    super(viewer, options)

    this._viewer = viewer
    this._options = options
    this._events = {}
  }

  static get ExtensionId() {
    return 'Viewing.Extension.Base'
  }

  static guid(format = 'xxxxxxxxxx') {
    var d = new Date().getTime()
    var guid = format.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16)
      })

    return guid
  }

  load() {
    return true
  }

  unload() {
    return true
  }

  on(event, fct) {
    this._events[event] = this._events[event] || []
    this._events[event].push(fct)
    return fct
  }

  off(event, fct) {
    if (event in this._events === false)
      return

    this._events[event].splice(
      this._events[event].indexOf(fct), 1)
  }

  emit(event /* , args... */ ) {
    if (this._events[event] === undefined)
      return

    var tmpArray = this._events[event].slice()

    for (var i = 0; i < tmpArray.length; ++i) {
      var result = tmpArray[i].apply(this,
        Array.prototype.slice.call(arguments, 1))

      if (result !== undefined)
        return result
    }

    return undefined
  }
}