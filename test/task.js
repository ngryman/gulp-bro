/*eslint no-sync: 0, no-inline-comments: 0*/
import test from 'ava'
import bro from '../'
import assert from 'stream-assert'
import vfs from 'vinyl-fs'
import catchStdout from 'catch-stdout'
import babelify from 'babelify'
import chokidar from 'chokidar'
import fs from 'fs'

test.cb('bundle a file', t => {
  vfs.src('test/fixtures/a+b.js', { read: false })
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('bundle a stream', t => {
  vfs.src('test/fixtures/a+b.js')
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('bundle multiple files separately', t => {
  vfs.src(['test/fixtures/a+b.js', 'test/fixtures/a+c.js'], { read: false })
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
  vfs.src('test/fixtures/empty.js', { read: false })
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().length, 498 /* browserify runtime */)
    ))
    .pipe(assert.end(t.end))
})

test.cb('use incremental build', t => {
  let times = []
  vfs.src('test/fixtures/incremental.js', { read: false })
    .pipe(bro())
    .on('time', time => times.push(time))
    .pipe(assert.end(() => {
      vfs.src('test/fixtures/incremental.js', { read: false })
        .pipe(bro())
        .on('time', time => times.push(time))
        .pipe(assert.end(() => {
          t.truthy(times[1] < times[0])
          t.end()
        }))
    }))
})

test.cb('accept browserify transforms', t => {
  vfs.src('test/fixtures/es6.js', { read: false })
    .pipe(bro({
      transform: babelify.configure({ presets: ['es2015'] })
    }))
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/_classCallCheck/).length, 1)
    ))
    .pipe(assert.end(t.end))
})

test.cb('log a syntax error', t => {
  const restore = catchStdout()

  vfs.src('test/fixtures/syntax_error.js', { read: false })
    .pipe(bro(() => {
      t.truthy(~restore().indexOf('SyntaxError'))
      t.end()
    }))
})

test.cb('emit a syntax error when asked to', t => {
  vfs.src('test/fixtures/syntax_error.js', { read: false })
    .pipe(bro({ error: 'emit' }))
    .on('error', err => {
      t.is(err.name, 'SyntaxError')
    })
    .pipe(assert.end(t.end))
})

test.cb('call an error handler when provided', t => {
  vfs.src('test/fixtures/syntax_error.js', { read: false })
    .pipe(bro({ error: err => t.is(err.name, 'SyntaxError') }))
    .pipe(assert.end(t.end))
})

test.cb('bundle a stream when deeply nested, #5', t => {
  vfs.src('test/fixtures/modules/d/e/f.js')
    .pipe(bro())
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 2)
    ))
    .pipe(assert.end(t.end))
})

test.cb('gulp.watch detect changes in main entry, #4', t => {
  let calls = 0

  fs.writeFileSync('test/fixtures/watch_entry.js', '// not empty')

  bundle()
  chokidar.watch('test/fixtures/watch_entry.js').on('change', bundle)

  function bundle() {
    vfs.src('test/fixtures/watch_entry.js')
      .pipe(bro())
      .pipe(assert.first(
        d => t.is(d.contents.toString().match(/alert("yay")/g).length, 2)
      ))
      .pipe(assert.end(() => {
        if (2 === ++calls) {
          fs.unlinkSync('test/fixtures/watch_entry.js')
          return t.end()
        }

        // mtime resolution can be 1-2sec depending on the os
        setTimeout(() => {
          fs.appendFileSync('test/fixtures/watch_entry.js', 'alert("yay")')
        }, 2000)
      }))
  }
})

test.cb('accept an external option, #25', t => {
  vfs.src('test/fixtures/external.js', { read: false })
    .pipe(bro({ external: './modules/b' }))
    .pipe(assert.length(1))
    .pipe(assert.first(
      d => console.log(d.contents.toString())
    ))
    .pipe(assert.first(
      d => t.is(d.contents.toString().match(/exports = '[ab]'/g).length, 1)
    ))
    .pipe(assert.end(t.end))
})
