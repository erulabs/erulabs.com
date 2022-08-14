const db = require('../../lib/db')
export default async function handler(req, res) {
  // const rows = await db
  //   .select('first_name', 'last_name', 'email', 'vehicle_type', 'vehicle_name', 'vehicle_length')
  //   .from('data')

  // const data = rows.map(u => {
  //   return [u.first_name, u.last_name, u.email, u.vehicle_type, u.vehicle_name, u.vehicle_length]
  // })

  res.status(200).json({ data: null })
}
