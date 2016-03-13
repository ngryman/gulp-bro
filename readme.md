# <div align=center>![](https://raw.githubusercontent.com/ngryman/artworks/master/gulp-bro/heading/gulp-bro.png)</div>

> gulp + browserify + incremental build, done right.

[![travis][travis-image]][travis-url] [![codecov][codecov-image]][codecov-url]

[travis-image]: https://img.shields.io/travis/ngryman/gulp-bro.svg?style=flat
[travis-url]: https://travis-ci.org/ngryman/gulp-bro
[codecov-image]: https://img.shields.io/codecov/c/github/ngryman/gulp-bro.svg
[codecov-url]: https://codecov.io/github/ngryman/gulp-bro


Even through *gulp* has [recipes] to make things work, configuring *browserify* needs too much boilerplate and understanding about how things work.
**gulp-bro** looks like any other *gulp* plugin, it does the exact same thing you can do manually, but hides the *ugly* stuff for you.

It also support [incremental build] out of the box, so you don't have to mess with *watchify* again.

[recipes]: https://github.com/gulpjs/gulp/tree/master/docs/recipes
[incremental build]: https://github.com/jsdf/browserify-incremental

## Install

```bash
npm install --save-dev gulp-bro
```

## Usage

### Simple build

```javascript
gulp.task('build', () =>
  gulp.src('app.js')
    .pipe(bro())
    .pipe(gulp.dest('dist'))
)

gulp.watch('*.js', ['build'])
```

*Subsequent calls to `build` will be fast thanks to incremental build.*

### Browserify transforms

```javascript
gulp.task('build', () =>
  gulp.src('app.js')
    .pipe(bro({
      transform: [babelify.configure({ presets: ['es2015'] })]
    })
    .pipe(gulp.dest('dist')
)
```

### Multiple bundles

```javascript
gulp.task('build', () =>
  gulp.src('*.js')
    .pipe(bro())
    .pipe(gulp.dest('dist')
)
```

## API

`bro([options], [callback])`

### `options` <sup><sub>`{object}`</sub></sup>

Except `error`, options are directly passed to *browserify*. So you can use *bro* as if you were using *browerify*. Here is a list of all [available options](https://github.com/substack/node-browserify#browserifyfiles--opts).

#### `error` <sup><sub>`{'emit'|function}`</sub></sup>

Another pitfall of using *browerify* manually was that error reporting had to be done manually too or you ended up with a huge callstack and a crashed process.
By default, *bro* reports nicely formatted errors:

![](https://raw.githubusercontent.com/ngryman/artworks/master/gulp-bro/medias/error-reporting.png)

You can customize things in 2 ways:

 - Set `emit` which will cause *bro* to emit the error, so you can catch it with `on('error')`.
 - Set a callback that will handle the error.

## FAQ

### What is incremental build?

If you use vanilla *browserify* with *gulp*, you end up with long compile times if you watch for changes. The reason is that each time a new *browserify* instance is created and has to parse and compile the whole bundle. Even if only one file has changed, the whole bundle is processed.

Usually you use *watchify* to improve this, and only recompile files that have changed. The only problem with *watchify* is that it monitors file changes on its own and needs a lot of boilerplate to integrate with *gulp*, precisely because of this.

*gulp* already provide a file watch mechanism that we can use out of the box. *bro* caches already compiled files and only recompile changes. So you can call repeatedly `bro` with optimal compile times.

## License

MIT © [Nicolas Gryman](http://ngryman.sh)
