import React from 'react'
import marked from 'marked'
import postIndex from './posts.jsx'
const TITLE = 0; const DATE = 1; const FILENAME = 2; const CONTENT = 3 // posts.jsx columns
const fourOhFour = [ '404', '404', '404', '# 404\nPage not found!' ] // 404 page content

export default class App extends React.Component {
  constructor (props) {
    super(props)
    let opacityIndex = 0
    if (window.location.pathname === '/' || postIndex[0][TITLE] === window.location.pathname.substr(3)) {
      postIndex[0].push(require(`./../build/posts/${postIndex[0][FILENAME]}`))
    } else {
      const found = postIndex.find((p) => p[TITLE] === window.location.pathname.substr(3))
      if (found) {
        const r = new window.XMLHttpRequest()
        r.open('GET', `/posts/${found[FILENAME]}`, true)
        r.onreadystatechange = () => {
          if (r.readyState !== 4 || r.status !== 200) postIndex.unshift(fourOhFour)
          else postIndex.map((p) => { if (p[TITLE] === found[TITLE]) p[CONTENT] = r.responseText })
        }
        r.send(null)
      } else postIndex.unshift(fourOhFour)
    }
    this.state = {
      post: postIndex[0], // By default, the latest post is shown
      // Create sidebar post list in decending order with decreasing opacity
      sideBarPosts: postIndex.map(function (p, i) {
        if (p[TITLE] === '404') return false
        const sideBarStyle = { opacity: 1 }
        sideBarStyle.opacity -= (opacityIndex++ * 2.5) * 0.1
        if (sideBarStyle.opacity < 0.1) sideBarStyle.opacity = 0.1
        return (<div style={ sideBarStyle } key={ i }>
          - <a href={ `/p/${p[TITLE]}` }>{ p[TITLE].replace(/_/g, ' ') }</a>
        </div>)
      })
    }
  }
  rawMarkup (html) { return { __html: marked(html || '', {sanitize: true}) } }
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
            <div className='post' dangerouslySetInnerHTML={ this.rawMarkup(this.state.post[CONTENT]) }></div>
          </div>
        </div>
      </div>
    )
  }
}
