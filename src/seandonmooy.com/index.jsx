
import Vue from 'vue'
import marked from 'marked'

import posts from './posts.js'

const CDN_URI = process.env.CDN_URI || ''
const VERSION = process.env.VERSION || '1.0.0'

const requestedPath = window.location.pathname.substr(1)
let matchedPost = posts.find(p => p.file === requestedPath)

if (matchedPost) {
  const request = new XMLHttpRequest()
  request.open('GET', `${CDN_URI}/posts/${matchedPost.file}`, true)
  request.onload = function () {
    if (request.status === 200) blog.post.body = marked(request.responseText)
    else blog.post.body = `# Sorry\nThere appears to have been an error`
  }
  request.send()
} else {
  matchedPost = posts[0]
  matchedPost.body = require(`./posts/${posts[0].file}`)
}

const sidebarPosts = new Vue({
  name: 'sidebarPosts',
  el: '#sidebarPosts',
  data: { posts },
  render (h) {
    return <div>
      { this.posts.map(post => <div>
        <a href={ `/${post.file}` } class='post'>{ post.title }</a>
      </div>) }
    </div>
  }
})

const blog = new Vue({
  name: 'blog',
  el: '#blog',
  data: { post: matchedPost },
  render (h) {
    return <div class='post'>
      <div class='post_date'>{ this.post.date }</div>
      <div class='post_content' domPropsInnerHTML={ marked(this.post.body) }></div>
    </div>
  }
})
