// @flow

import Vue from 'vue'
import marked from 'marked'

import posts from './posts.js'

const requestedPath = window.location.pathname.substr(1)
let matchedPost = posts.find(p => p.file === requestedPath)

if (matchedPost) {
  const request = new window.XMLHttpRequest()
  request.open('GET', `/posts/${matchedPost.file}.md`, true)
  request.onload = function () {
    if (request.status === 200) {
      blog.post = {
        title: blog.post.title,
        date: blog.post.date,
        file: blog.post.file,
        body: request.responseText
      }
    } else blog.post.body = `# Sorry\nThere appears to have been an error`
  }
  request.send()
} else {
  matchedPost = posts[0]
  // $FlowIssue
  matchedPost.body = require(`./posts/${posts[0].file}.md`)
}

const maxTitleLengthInSidebar = 35

// eslint-disable-next-line no-unused-vars
const sidebarPosts = new Vue({
  name: 'sidebarPosts',
  el: '#sidebarPosts',
  data: { posts },
  render (h) {
    return (
      <div>
        {this.posts.map((post, i) => {
          let title = post.title
          if (title.length > maxTitleLengthInSidebar) {
            title = post.title.substr(0, maxTitleLengthInSidebar) + '...'
          }
          return (
            <div class="small">
              {i + 1}. <a href={`/${post.file}`} class="post">{title}</a>
            </div>
          )
        })}
      </div>
    )
  }
})

const blog = new Vue({
  name: 'blog',
  el: '#blog',
  data: { post: matchedPost },
  render (h) {
    return (
      <div class="post">
        <div class="post_date">{this.post.date || 'who knows?'}</div>
        <div
          class="post_content"
          domPropsInnerHTML={marked(this.post.body || '# ' + this.post.title)}
        />
      </div>
    )
  }
})
