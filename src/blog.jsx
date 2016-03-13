// Seandon's ultra simple blog project v99487249
// This time with react and a clever loading system
import React from 'react'
import marked from 'marked'
import { TITLE, DATE, FILENAME, CONTENT, POSTS, PAGENOTFOUND } from './posts.jsx'

export default class App extends React.Component {
  constructor (props) {
    console.log('wut')
    super(props) // React + ES6, all worth it to type 'super props'
    this.state = { post: POSTS[0] }
    if (window.location.pathname === '/' || window.location.pathname.substr(3) === POSTS[0][TITLE]) {
      this.state.post[CONTENT] = require(`./../public/posts/${POSTS[0][FILENAME]}`)
    } else {
      const found = POSTS.find((p) => p[TITLE] === window.location.pathname.substr(3))
      if (found) {
        this.state.post = found; this.loadPost(found[FILENAME])
      } else this.state.post = PAGENOTFOUND
    }
    let opacity = 1 // Create sidebar post list in decending order with decreasing opacity
    this.state.sideBarPosts = POSTS.map(function (p, i) {
      return <div style={ { opacity: 1 - (i * 0.2) } } key={ i }>
        <span className='less small'>{ i + 1 }. </span>
        <a href={ `/b/${p[TITLE]}` }>{ p[TITLE].replace(/_/g, ' ') }</a>
      </div>
    })
  }
  handleChange (e) {
    this.setState({ query: e.target.value })
    console.log(e)
  }
  rawMarkup (html) { return { __html: marked(html || '', { sanitize: true }) } }
  loadPost (filename) {
    const r = new window.XMLHttpRequest()
    r.open('GET', `/posts/${filename}`, true)
    r.onreadystatechange = () => {
      if (r.readyState !== 4 || r.status !== 200) return false
      else this.setState({ post: [...this.state.post, r.responseText] })
    }
    r.send(null)
  }
  render () {
    return (
      <div className='container'>
        <div className='row'>
          <div className='four columns sidebar'>
            <div className='more'>Hi, I'm Seandon!</div>
            <div className='small'>I live in San Francisco and</div>
            <div className='small'>write computer programs</div>
            <div className='less'>- - - - - - -</div>
            <div>work @ <a href='https://imgur.com'>Imgur</a></div>
            <div><a href='mailto:seandon.mooy@gmail.com'>email</a> / <a href='/assets/seandondotmooyatgmail.pub'>pgp</a></div>
            <div><a href='https://github.com/erulabs'>github</a> / <a href='/assets/resume.pdf'>resume</a></div>
            <div><a href='https://github.com/erulabs/seandonmooy.com'>view source</a></div>
            <div className='less'>- - - - - - -</div>
            <div className='small blogitem'>{ this.state.sideBarPosts }</div>
          </div>
          <div className='eight columns content'>
            <div className='post'>
              <div className='post_date small'>{ this.state.post[DATE] }</div>
              <div className='post_content' dangerouslySetInnerHTML={ this.rawMarkup(this.state.post[CONTENT]) }></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
