// @flow

const fs = require('fs')
const gulp = require('gulp')
const gutil = require('gulp-util')
const browserSync = require('browser-sync')
const less = require('gulp-less')
const replace = require('gulp-replace')
const cleanCSS = require('gulp-clean-css')

const buildPages = require('./buildPages')

const clientSync = browserSync.create()
const tasks = {}

const CDN_URI = process.env.CDN_URI || ''

const handleErrors = function (err) {
  gutil.log(err)
  this.emit('end')
}
function doCopy (version, name, ext, dest) {
  if (!ext) ext = '*'
  if (!dest) dest = name
  const iName = [name, 'html'].join('')
  tasks[iName] = function () {
    return gulp
      .src([`./src/${name}/**/${ext}`])
      .on('error', handleErrors)
      .pipe(gulp.dest(`./_build/${dest}/`))
      .pipe(clientSync.stream())
  }
  gulp.task(iName, tasks[iName])
}
function doHtml (version, name) {
  const iName = [name, 'html'].join('')
  tasks[iName] = function () {
    return gulp
      .src([`./src/*.html`])
      .on('error', handleErrors)
      .pipe(replace('$CDN_URI', CDN_URI))
      .pipe(replace('$VERSION', version))
      .pipe(buildPages())
      .pipe(gulp.dest(`./_build/`))
      .pipe(clientSync.stream())
  }
  gulp.task(iName, tasks[iName])
}
function doLess (version, name) {
  const iName = [name, 'less'].join('')
  tasks[iName] = function () {
    return gulp
      .src([`./src/*.less`])
      .pipe(less({}))
      .pipe(cleanCSS())
      .on('error', handleErrors)
      .pipe(gulp.dest(`./_build/`))
      .pipe(clientSync.stream())
  }
  gulp.task(iName, tasks[iName])
}

const WWW_VERSION = fs
  .readFileSync('./src/version.txt')
  .toString()
  .split('\n')[0]
doCopy(WWW_VERSION, 'assets')
doCopy(WWW_VERSION, 'posts')
doHtml(WWW_VERSION)
doCopy(WWW_VERSION, 'favicons', '*', '.')
doLess(WWW_VERSION)

gulp.task('default', Object.keys(tasks))

gulp.task('watch', ['default'], () => {
  clientSync.init({
    server: {
      baseDir: './_build'
    },
    port: 3000
  })

  gulp.watch('./src/*.html', ['html'])
  gulp.watch('./src/*.less', ['less'])
  gulp.watch('./src/assets/**/*', ['assets-copy'])
  gulp.watch('./posts/*.md', ['html'])
})
