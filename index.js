'use strict'

const browserify = require('browserify')
const incremental = require('browserify-incremental')
const intoStream = require('into-stream')
const through2 = require('through2')
const gutil = require('gulp-util')
const concat = require('concat-stream')
const path = require('path')

const bundlers = {}

/**
 * Return a vinyl transform stream.
 *
 * @param  {object|function} [opts]
 * @param  {function} [callback]
 * @return {streams.Transform}
 */
function bro(opts, callback) {
  opts = parseArguments(opts, callback)
  return transform(opts)
}

module.exports = bro

/* -------------------------------------------------------------------------- */

/**
 * Return a vinyl transform stream.
 *
 * @param  {object} opts
 * @return {streams.Transform}
 */
function transform(opts) {
  return through2.obj(function(file, encoding, next) {
    const bundler = createBundler(opts, file, this)

    bundler.bundle()
      .on('error', createErrorHandler(opts, this))
      .pipe(concat(data => {
        file.contents = data
        next(null, file)
      }))
  })
}

/**
 * Return a new browserify bundler.
 *
 * @param  {object} opts
 * @param  {vinyl} file
 * @param  {stream.Transform} transform
 * @return {Browserify}
 */
function createBundler(opts, file, transform) {
  opts.entries = file.isNull() ? file.path : intoStream(file.contents)
  opts.basedir = 'string' !== typeof opts.entries ? path.dirname(file.path) : undefined

  let bundler = bundlers[file.path]

  if (bundler) {
    bundler.removeAllListeners('log')
    bundler.removeAllListeners('time')
  }
  else {
    bundler = browserify(Object.assign(opts, incremental.args))
    incremental(bundler)
    bundlers[file.path] = bundler
  }

  bundler.on('log', log)
  bundler.on('log', message => transform.emit('log', message))
  bundler.on('time', time => transform.emit('time', time))

  return bundler
}

/**
 * Return a new error handler.
 *
 * @param  {object} opts
 * @param  {stream.Transform} transform
 * @return {function}
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
 * Parse options, arguments juggling
 *
 * @param  {object} opts
 * @param  {function} callback
 * @return {object}
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
 * Format and log the given message.
 *
 * @param {string} message
 */
function log(message) {
  gutil.log(`[${gutil.colors.cyan('bro')}] ${message}`)
}
