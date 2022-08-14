const db = require('knex')({
  client: 'sqlite3',
  connection: { filename: './seandonmooy.sqlite' },
})

module.exports = db
