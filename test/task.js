import test from 'ava'
import bro from '../'
import assert from 'stream-assert'
import vfs from 'vinyl-fs'
import touch from 'touch'
import catchStdout from 'catch-stdout'
import tmpdir from 'os-tmpdir'
import path from 'path'
import chokidar from 'chokidar'

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
      d => t.is(d.contents.length, 498)
    ))
    .pipe(assert.end(t.end))
})

test.cb('accept callback', t => {
  vfs.src('fixtures/empty.js', { read: false })
    .pipe(bro(bundle => bundle
      .pipe(assert.length(1))
      .pipe(assert.first(
        d => t.is(d.contents.length, 498)
      ))
      .pipe(assert.end(t.end))
    ))
})

test.cb('use incremental build', t => {
  let calls = 0
  vfs.src('fixtures/watch.js', { read: false })
    .pipe(bro({ watch: true }, bundle => {
      if (2 === ++calls) return t.end()
      touch.sync('fixtures/modules/a.js')
    }))
})

test.cb('accept browserify transforms', t => {
  vfs.src('fixtures/a+b.js', { read: false })
    .pipe(bro({
      transform: ['babelify']
    }))
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.length, 721)
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

test.cb('call a error handler when provided', t => {
  vfs.src('fixtures/syntax_error.js', { read: false })
    .pipe(bro({ error: err => t.is(err.name, 'SyntaxError') }))
    .pipe(assert.end(t.end))
})

test.cb('gulp.watch should detect changes', t => {
  let dest = tmpdir()
  let calls = 0

  vfs.src('fixtures/watch.js', { read: false })
    .pipe(bro({ watch: true }, bundle => bundle
      .pipe(vfs.dest(dest))
      .pipe(assert.end(() => {
        if (2 === ++calls) return
        touch.sync('fixtures/modules/a.js')
      }))
    ))

  chokidar.watch(path.join(dest, 'watch.js')).on('change', () => {
    if (2 === calls) t.end()
  })
})
