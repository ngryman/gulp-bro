# <div align=center>![](https://raw.githubusercontent.com/ngryman/artworks/master/gulp-bro/heading/gulp-bro.png)</div>

> gulp + browserify + watchify, done right.

[![travis][travis-image]][travis-url] [![codecov][codecov-image]][codecov-url]

[travis-image]: https://img.shields.io/travis/ngryman/gulp-bro.svg?style=flat
[travis-url]: https://travis-ci.org/ngryman/gulp-bro
[codecov-image]: https://img.shields.io/codecov/c/github/ngryman/gulp-bro.svg
[codecov-url]: https://codecov.io/github/ngryman/gulp-bro


Even through *gulp* has [recipes] to make things work, configuring *browserify* needs too much boilerplate and understanding about how things work.
**gulp-bro** looks like any other *gulp* plugin, it does the exact same thing you can do manually, but hides the *ugly* stuff for you.

It also support [incremental build] out of the box, so you don't have to mess with *watchify* again.

[recipes]: https://github.com/gulpjs/gulp/tree/master/docs/recipes
[incremental build]: https://github.com/substack/watchify

## Install

```bash
npm install --save-dev gulp-bro
```

## Usage

### Simple build

```javascript
gulp.task('build', () =>
  gulp.src('app.js')
    .then(bro())
    .then(gulp.dest('dist'))
)
```

### Watch build

```javascript
gulp.task('build', () =>
  gulp.src('app.js')
    .then(bro({ watch: true }, bundle => bundle
      .then(gulp.dest('dist'))
    ))
)
```

*Note the callback, it is explained [here](#why-do-i-need-a-callback-for-watch-builds).*

### Browserify transforms

```javascript
gulp.task('build', () =>
  gulp.src('app.js')
    .then(bro({
      watch: true,
      transform: ['babelify']
    }, bundle => bundle
      .then(gulp.dest('dist'))
    ))
)
```

### Multiple bundles

```javascript
gulp.task('build', () =>
  gulp.src('*.js')
    .then(bro({
      watch: true,
      transform: ['babelify']
    }, bundle => bundle
      .then(gulp.dest('dist'))
    ))
)
```

## API

`bro([options], [callback])`

### `options` <sup><sub>`{object}`</sub></sup>

Except `watch` and `error`, options are directly passed to *browserify*. So you can use *bro* as if you were using *browerify*. See a list of [available options](https://github.com/substack/node-browserify#browserifyfiles--opts).

#### `watch` <sup><sub>`{object}`</sub></sup>

If set to `true`, *bro* will watch for changes and rebuild the bundle. It uses *watchify* under the hood with all incremental build goodness. You should use this instead of `gulp.watch`.

If you need to apply other gulp transforms after each build (i.e live reload, minification), you will need to provide a callback.

#### `error` <sup><sub>`{'emit'|function}`</sub></sup>

Another pitfall of using *browerify* manually was that error reporting had to be done manually too or you ended up with a huge callstack and crashed process.
By default, *bro* reports nicely formatted errors:

![](https://raw.githubusercontent.com/ngryman/artworks/master/gulp-bro/medias/error-reporting.png)

You can customize things in 2 ways:

 - Set `emit` which will cause *bro* to emit the error, so you can catch it with `on('error')`.
 - Set a callback that will handle the error.

### `callback` <sup><sub>`{function(bundle)}`</sub></sup>

It will be executed after the end of the build. `bundle` is a classic *gulp* stream you can pipe to for further processing.

## FAQ

### Why do I need a callback for watch builds?

*gulp* tasks are originally meant to execute once. Once a plugin has been initialized, you can't re-use it. Usually when you watch using `gulp.watch` the whole task is executed again.

*watchify* will monitor for changes and emit data when a new bundle is built. And as we can't reuse already initialized plugins, we need a new context each time. The callback has its own closure allowing plugins to initialize again and make things work.

## License

MIT © [Nicolas Gryman](http://ngryman.sh)
