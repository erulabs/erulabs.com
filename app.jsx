import React from 'react'

const location = window.location.hash || 'index'

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.words = 'foobarasdasdz'
  }
  render () {
    return <div>
      { location }
    </div>
  }
}
