import test from 'ava'
import bro from '../'
import assert from 'stream-assert'
import vfs from 'vinyl-fs'
import catchStdout from 'catch-stdout'
import babelify from 'babelify'
import chokidar from 'chokidar'
import touch from 'touch'

test.cb('bundle a file', t => {
  vfs.src('fixtures/a+b.js', { read: false })
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('take file contents when available', t => {
  vfs.src('fixtures/a+b.js')
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('bundle multiple files separately', t => {
  vfs.src(['fixtures/a+b.js', 'fixtures/a+c.js'], { read: false })
    .pipe(bro())
    .pipe(assert.length(2))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.second(
      d => t.is(d.contents.toString().match(/exports = '[ac]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('bundle an empty file', t => {
  vfs.src('fixtures/empty.js', { read: false })
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.length, 610)
    ))
    .pipe(assert.end(t.end))
})

test.cb('use incremental build', t => {
  let times = []
  vfs.src('fixtures/incremental.js', { read: false })
    .pipe(bro())
    .on('time', time => times.push(time))
    .pipe(assert.end(() => {
      vfs.src('fixtures/incremental.js', { read: false })
        .pipe(bro())
        .on('time', time => times.push(time))
        .pipe(assert.end(() => {
          t.ok(times[1] < times[0])
          t.end()
        }))
    }))
})

test.cb('accept browserify transforms', t => {
  vfs.src('fixtures/es6.js', { read: false })
    .pipe(bro({
      transform: babelify.configure({ presets: ['es2015'] })
    }))
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.length, 836)
    ))
    .pipe(assert.end(t.end))
})

test.cb('log a syntax error', t => {
  const restore = catchStdout()

  vfs.src('fixtures/syntax_error.js', { read: false })
    .pipe(bro(() => {
      t.ok(~restore().indexOf('SyntaxError'))
      t.end()
    }))
})

test.cb('emit a syntax error when asked to', t => {
  vfs.src('fixtures/syntax_error.js', { read: false })
    .pipe(bro({ error: 'emit' }))
    .on('error', err => {
      t.is(err.name, 'SyntaxError')
    })
    .pipe(assert.end(t.end))
})

test.cb('call an error handler when provided', t => {
  vfs.src('fixtures/syntax_error.js', { read: false })
    .pipe(bro({ error: err => t.is(err.name, 'SyntaxError') }))
    .pipe(assert.end(t.end))
})

test.cb('gulp.watch should detect changes', t => {
  let calls = 0

  bundle()
  chokidar.watch('fixtures/modules/a.js').on('change', bundle)

  function bundle() {
    vfs.src('fixtures/watch.js', { read: false })
      .pipe(bro())
      .pipe(assert.end(() => {
        if (2 === ++calls) t.end()
        touch.sync('fixtures/modules/a.js')
      }))
  }
})
