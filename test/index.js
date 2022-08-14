// @flow

const fs = require('fs')
const { expect } = require('chai')

const describe = global.describe
const it = global.it

const db = require('../lib/db')

describe('process', function () {
  it('adds records to the database', async function () {})
})

global.after(function () {
  setTimeout(() => {
    db.destroy()
  }, 100)
})
