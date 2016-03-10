import React from 'react'
import marked from 'marked'

import posts from './posts.jsx'

// Bundle the latest post
posts[0].push(require(`./posts/${posts[0][2]}`))

export default class App extends React.Component {
  render () {
    const location = window.location.hash || 'LATEST'
    let post = posts[0]
    if (location !== 'LATEST') {
      post = posts.filter((p) => p[1] === location)
      if (post.length > 0) {
        // http req post data
        post = post[0]
      } else post = ['404', 'for ever and ever', null, "# 404\nThis page doesn't exist :("]
    }
    const sidebarPosts = posts.map((p, i) =>
      <div key={ i }>{ p[0] }</div>
    )
    return (
      <div className='container'>
        <div className='row'>
          <div className='three columns sidebar'>
            <div className='more'>Hi, I'm Seandon!</div>
            <div className='small'>I live in San Francisco and write computer programs</div>
            <div className='less'>- - - - - - - - -</div>
            <div>work @ <a href='https://imgur.com'>Imgur</a></div>
            <div><a href='mailto:seandon.mooy@gmail.com'>email</a> / <a href='/assets/pgp.txt'>pgp</a></div>
            <div><a href='https://github.com/erulabs'>github</a> / <a href='/assets/resume.pdf'>resume</a></div>
            <div><a href='https://github.com/erulabs/seandonmooy.com'>view source</a></div>
            <div className='less'>- - - - - - - - -</div>
            <div className='small blogitem'>{ sidebarPosts }</div>
          </div>
          <div className='nine columns content'>
            <div className='post' dangerouslySetInnerHTML={{__html: marked(post[3])}}></div>
          </div>
        </div>
      </div>
    )
  }
}
