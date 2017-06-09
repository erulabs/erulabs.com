// @flow

const through2 = require('through2')
const fs = require('fs')
const Vinyl = require('vinyl')
const marked = require('marked')
const moment = require('moment')

const postsDir = './posts'

// This file reads the ./posts directory and renders the built HTML
module.exports = function () {
  const posts = []
  const sidebar = []
  fs.readdir(postsDir, function (err, results) {
    if (err) {
      process.stderr.write('Couldnt stat ' + postsDir)
      throw err
    }
    for (let i = 0; i < results.length; i++) {
      const title = results[i]
        .replace(new RegExp(/[0-9]+_/, 'g'), '')
        .replace(new RegExp('_', 'g'), ' ')
        .replace('.md', '')
      const time = fs.statSync(postsDir + '/' + results[i]).ctime.getTime()
      posts.push({
        filename: results[i],
        title: title,
        content:
          `<div class='post_date'>` +
            moment(time).calendar() +
            `</div>` +
            `<div class='post_content'>` +
            marked(fs.readFileSync(postsDir + '/' + results[i]).toString()) +
            `</div>`
      })
      sidebar.unshift(
        '<div>#' +
          (results.length - i) +
          '. <a href="/posts/' +
          results[i].replace('.md', '.html') +
          '?v=' +
          time +
          '" alt="' +
          title +
          '">',
        title,
        '</a></div>'
      )
    }
  })
  return through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file)
    }
    const output = []
    if (file.isBuffer()) {
      const contents = file.contents.toString()
      for (let i = 0; i < posts.length; i++) {
        let theFile = new Vinyl({
          cwd: '/',
          base: '/',
          path: posts[i].filename.replace('.md', '.html'),
          contents: Buffer.from(
            contents
              .replace('DATA_SIDEBAR_POSTS', sidebar.join(''))
              .replace('DATA_POST', posts[i].content)
          )
        })
        theFile.dirname = '/posts'
        this.push(theFile)
      }
      // Write index file:
      file.contents = Buffer.from(
        contents
          .replace('DATA_SIDEBAR_POSTS', sidebar.join(''))
          .replace('DATA_POST', marked(posts[0].content).toString())
      )
      output.push(file)
      this.push(file)
      cb(null, file)
    } else if (file.isStream()) {
      process.stderr.write('buildPages got stream instead of buffer!')
      process.exit(1)
    } else {
      cb(null, file)
    }
  })
}
