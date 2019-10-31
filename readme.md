<p align="center">
  <img alt="Gulp Bro" src="https://raw.githubusercontent.com/ngryman/artworks/master/gulp-bro/heading/gulp-bro-2x.png" width="228">
</p>

<p align="center">
  gulp + browserify + incremental build, done right.
</p>

<p align="center">
  <a href="//travis-ci.org/ngryman/gulp-bro">
    <img alt="Build Status" src="https://img.shields.io/travis/ngryman/gulp-bro.svg">
  </a>
  <a href="//codecov.io/github/ngryman/gulp-bro">
    <img alt="Coverage" src="https://img.shields.io/codecov/c/github/ngryman/gulp-bro.svg">
  </a>
  <a href="//codecov.io/github/ngryman/gulp-bro">
    <img alt="Dependencies" src="https://badges.greenkeeper.io/ngryman/gulp-bro.svg">
  </a>
</p>

---


Even through **gulp** has [recipes] to make things work, configuring **browserify** needs too much boilerplate and understanding about how things work.
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
      transform: [
        babelify.configure({ presets: ['es2015'] }),
        [ 'uglifyify', { global: true } ]
      ]
    }))
    .pipe(gulp.dest('dist')
)
```

### Multiple bundles

```javascript
gulp.task('build', () =>
  gulp.src('*.js')
    .pipe(bro())
    .pipe(gulp.dest('dist'))
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

## Contributors

[//]: contributor-faces
<a href="https://github.com/ngryman"><img src="https://avatars2.githubusercontent.com/u/892048?v=4" title="ngryman" width="80" height="80"></a>
<a href="https://github.com/apps/greenkeeper"><img src="https://avatars3.githubusercontent.com/in/505?v=4" title="greenkeeper[bot]" width="80" height="80"></a>
<a href="https://github.com/DylanPiercey"><img src="https://avatars2.githubusercontent.com/u/4985201?v=4" title="DylanPiercey" width="80" height="80"></a>
<a href="https://github.com/shannonmoeller"><img src="https://avatars3.githubusercontent.com/u/155164?v=4" title="shannonmoeller" width="80" height="80"></a>
<a href="https://github.com/fralonra"><img src="https://avatars2.githubusercontent.com/u/20400873?v=4" title="fralonra" width="80" height="80"></a>

[//]: contributor-faces

<sup>Generated with [contributors-faces](https://github.com/ngryman/contributor-faces).</sup>

## License

MIT © [Nicolas Gryman](http://ngryman.sh)
