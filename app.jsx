import React from 'react'

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.words = 'foobarbaz'
  }
  render () {
    return <div>
      { this.words }
    </div>
  }
}
