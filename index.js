'use strict'

const browserify = require('browserify')
const incremental = require('browserify-incremental')
const through2 = require('through2')
const colors = require('ansi-colors')
const fancyLog = require('fancy-log')
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
  // omit file contents to make browserify-incremental work propery
  // on main entry (#4)
  opts.entries = file.path
  opts.basedir = path.dirname(file.path)

  let bundler = bundlers[file.path]

  if (bundler) {
    bundler.removeAllListeners('log')
    bundler.removeAllListeners('time')
  }
  else {
    bundler = browserify(Object.assign(opts, incremental.args))
    // only available via method call (#25)
    if (opts.external) {
      bundler.external(opts.external)
    }
    incremental(bundler)
    bundlers[file.path] = bundler
  }

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
    if ('emit' === opts.error) {
      transform.emit('error', err)
    }
    else if ('function' === typeof opts.error) {
      opts.error(err)
    }
    else {
      const message = colors.red(err.name) + '\n' + err.toString()
        .replace(/(ParseError.*)/, colors.red('$1'))
      log(message)
    }

    transform.emit('end')

    if (opts.callback) {
      opts.callback(through2())
    }
  }
}

/* -------------------------------------------------------------------------- */

/**
 * Parse options, arguments juggling.
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
  fancyLog(`[${colors.cyan('bro')}] ${message}`)
}
