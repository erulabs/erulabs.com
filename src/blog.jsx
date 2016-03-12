// Seandon's ultra simple blog project v99487249
// This time with react and a clever loading system
import React from 'react'
import marked from 'marked'
import { TITLE, DATE, FILENAME, CONTENT, POSTS, PAGENOTFOUND } from './posts.jsx'

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = { post: POSTS[0] }
    if (window.location.pathname === '/' || window.location.pathname.substr(3) === POSTS[0][TITLE]) {
      POSTS[0].push(require(`./../public/posts/${POSTS[0][FILENAME]}`))
    } else {
      const found = POSTS.find((p) => p[TITLE] === window.location.pathname.substr(3))
      if (found) {
        this.state.post = found; this.loadPost(found[FILENAME])
      } else this.state.post = PAGENOTFOUND
    }
    let opacity = 1 // Create sidebar post list in decending order with decreasing opacity
    this.state.sideBarPosts = POSTS.map(function (p, i) {
      opacity -= i * 0.25; if (opacity < 0.1) opacity = 0.1
      return <div style={ { opacity } } key={ i }>
        <span className='less small'>{ i + 1 }. </span>
        <a href={ `/p/${p[TITLE]}` }>{ p[TITLE].replace(/_/g, ' ') }</a>
      </div>
    })
  }
  rawMarkup (html) { return { __html: marked(html || '', { sanitize: true }) } }
  loadPost (filename) {
    const r = new window.XMLHttpRequest()
    r.open('GET', `/posts/${filename}`, true)
    r.onreadystatechange = () => {
      if (r.readyState !== 4 || r.status !== 200) return false
      else this.setState({ post: [this.state.post[0], this.state.post[1], this.state.post[2], r.responseText] })
    }
    r.send(null)
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
            <div className='post'>
              <div className='post_date'>{ this.state.post[DATE] }</div>
              <div className='post_content' dangerouslySetInnerHTML={ this.rawMarkup(this.state.post[CONTENT]) }></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
