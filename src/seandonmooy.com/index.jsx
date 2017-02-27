
import Vue from 'vue'
import marked from 'marked'

import posts from './posts.js'

const CDN_URI = process.env.CDN_URI || ''
const VERSION = process.env.VERSION || '1.0.0'

// Bundle the latest post
posts[0].push(require(`./posts/${posts[0][2]}`))
const location = window.location.hash || 'LATEST'

let post = posts[0]
if (location !== 'LATEST') {
  post = posts.filter((p) => p[1] === location)
  if (post.length > 0) {
    // http req post data
    post = post[0]
  } else post = ['404', 'for ever and ever', null, "# 404\nThis page doesn't exist :("]
}
const sidebarPosts = posts.map((p, i) => {
  // <div key={ i }>
  //   <a>{ p[0] }</a>
  // </div>
})

const blog = new Vue({
  el: '#blog',
  data: {
    count: 0
  },
  render (h) {
    return <div id="foo">{ this.count }</div>
  }
})

setInterval(() => {
  blog.count++
}, 1000)
