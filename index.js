'use strict'

const browserify = require('browserify')
const intoStream = require('into-stream')
const through2 = require('through2')
const watchify = require('watchify')
const gutil = require('gulp-util')

/**
 * [bro description]
 * @param  {[type]}   opts     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function bro(opts, callback) {
  opts = parseArguments(opts, callback)
  return transform(opts)
}

module.exports = bro

/* -------------------------------------------------------------------------- */

/**
 * [transform description]
 * @param  {[type]} opts [description]
 * @return {[type]}      [description]
 */
function transform(opts) {
  return through2.obj(function(file, encoding, next) {
    const bundler = createBundler(opts, file)
    const bundle = createBundle(bundler, opts, this, file, next)

    if (opts.watch) {
      bundler.on('update', bundle)
      bundler.on('log', log)
    }

    bundle()
  })
}

/**
 * [createBundler description]
 * @param  {[type]} opts [description]
 * @param  {[type]} file [description]
 * @return {[type]}      [description]
 */
function createBundler(opts, file) {
  const entries = file.isNull() ? file.path : intoStream(file.contents)
  const basedir = 'string' !== typeof entries ? file.base : undefined

  let bundler = browserify({ entries, basedir })
  if (opts.watch) {
    bundler = watchify(bundler)
  }

  return bundler
}

/**
 * [createBundle description]
 * @param  {[type]}   bundler   [description]
 * @param  {[type]}   opts      [description]
 * @param  {[type]}   transform [description]
 * @param  {[type]}   file      [description]
 * @param  {Function} next      [description]
 * @return {[type]}             [description]
 */
function createBundle(bundler, opts, transform, file, next) {
  return function() {
    let contents = new Buffer('')

    bundler.bundle()
      .on('data', data => { contents = Buffer.concat([contents, data]) })
      .on('error', createErrorHandler(opts, transform))
      .on('end', () => {
        file.contents = contents

        if (opts.callback) {
          const bundleStream = through2.obj()
          opts.callback(bundleStream)
          bundleStream.push(file)
          bundleStream.push(null)
        }
        else {
          next(null, file)
        }
      })
  }
}

/**
 * [createErrorHandler description]
 * @param  {[type]} opts      [description]
 * @param  {[type]} transform [description]
 * @return {[type]}           [description]
 */
function createErrorHandler(opts, transform) {
  return err => {
    if (!opts.error || 'log' === opts.error) {
      const message = gutil.colors.red(err.name) + '\n' + err.toString()
        .replace(/(ParseError.*)/, gutil.colors.red('$1'))
      log(message)
    }
    else if ('emit' === opts.error) {
      transform.emit('error', err)
    }
    else if ('function' === typeof opts.error) {
      opts.error(err)
    }

    transform.emit('end')

    if (opts.callback) {
      opts.callback(through2())
    }
  }
}

/* -------------------------------------------------------------------------- */

/**
 * [parseArguments description]
 * @param  {[type]}   opts     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function parseArguments(opts, callback) {
  if ('function' === typeof opts) {
    callback = opts
    opts = {}
  }

  opts = opts || {}
  opts.callback = callback

  return opts
}

/**
 * [log description]
 * @param  {[type]} message [description]
 */
function log(message) {
  gutil.log(`[${gutil.colors.cyan('bro')}] ${message}`)
}
