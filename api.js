const db = require('./lib/db')

const apiInit = async () => {
  // await db.schema.createTable('data', table => {
  //   table.increments('id')
  //   table.string('first_name')
  //   table.string('last_name')
  //   table.string('email')
  //   table.string('vehicle_type')
  //   table.string('vehicle_name')
  //   table.string('vehicle_length')
  // })
  console.log('apiInit complete')
}

module.exports = { apiInit }
