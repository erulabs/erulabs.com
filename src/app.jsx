import React from 'react'
import marked from 'marked'

import postIndex from './posts.jsx'
const humanizeTitles = (t) => t.replace(/_/g, ' ')

if (window.location.pathname === '/' || postIndex[0][0] === window.location.pathname.substr(3)) {
  postIndex[0].push(require(`./posts/${postIndex[0][2]}`))
} else if (postIndex.find((p) => p[0] === window.location.pathname.substr(3))) {
  console.log('Not a 404 - need to load the post')
} else {
  postIndex[0] = [ '404', '404', '404', '# 404\nPage not found!' ]
}

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      post: postIndex[0],
      sideBarPosts: postIndex.map(function (p, i) {
        const sideBarStyle = { opacity: 1 }
        sideBarStyle.opacity -= (i * 2.5) * 0.1
        if (sideBarStyle.opacity < 0.1) sideBarStyle.opacity = 0.1
        const uri = `/p/${p[0]}`
        return (<div style={ sideBarStyle } key={ i }>
          <a href={ uri }>{ humanizeTitles(p[0]) }</a>
        </div>)
      })
    }
  }
  rawMarkup (html) {
    console.log('rendering:', html)
    return { __html: marked(html || '', {sanitize: true}) }
  }
  render () {
    return (
      <div className='container'>
        <div className='row'>
          <div className='three columns sidebar'>
            <div className='more'>Hi, I'm Seandon!</div>
            <div className='small'>I live in San Francisco and write computer programs</div>
            <div className='less'>- - - - - - - - -</div>
            <div>work @ <a href='https://imgur.com'>Imgur</a></div>
            <div><a href='mailto:seandon.mooy@gmail.com'>email</a> / <a href='/assets/seandondotmooyatgmail.pub'>pgp</a></div>
            <div><a href='https://github.com/erulabs'>github</a> / <a href='/assets/resume.pdf'>resume</a></div>
            <div><a href='https://github.com/erulabs/seandonmooy.com'>view source</a></div>
            <div className='less'>- - - - - - - - -</div>
            <div className='small blogitem'>{ this.state.sideBarPosts }</div>
          </div>
          <div className='nine columns content'>
            <div className='post' dangerouslySetInnerHTML={ this.rawMarkup(this.state.post[3]) }></div>
          </div>
        </div>
      </div>
    )
  }
}
