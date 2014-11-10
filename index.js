var through2 = require('through2')
var duplex2 = require('duplexer2')
var from = require('new-from')
var bl = require('bl')

module.exports = createStream

function createStream(transform) {
  return through2.obj(write, flush)

  function write(file, _, next) {
    if (file.isNull()) return next(null, file)

    var output = transform(file.path)
    var contents = file.contents
    var stream = this

    if (file.isStream()) {
      file.contents.pipe(output)
      file.contents.on('error', stream.emit.bind(stream, 'error'))
      file.contents = output
      return next(null, file)
    }

    from([contents])
      .pipe(output)
      .pipe(bl(function(err, buffer) {
        if (err) return stream.emit('error', err)
        file.contents = buffer
      	next(null, file)
      }))
  }

  function flush() {
    this.push(null)
    this.emit('end')
  }
}
