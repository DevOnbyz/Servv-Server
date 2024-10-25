const runQuery = require('../db/runQuery')
const { BUILDING_DATABASE } = require('../lib/constants')
const hashPassword = require('../lib/hashPassword')

const addOrgQuery = `INSERT INTO ${BUILDING_DATABASE}.organisation (\`name\`, \`domain\`, \`config\`) VALUES ('Sreedhanya', 'sreedhanya', '{}')`
const addManager = `INSERT INTO ${BUILDING_DATABASE}.admin SET ?`

const main = async () => {
  try {
    const orgID = (await runQuery(BUILDING_DATABASE, addOrgQuery))?.insertId
    await runQuery(BUILDING_DATABASE, addManager , {firstname: 'test', lastname: 'user', username: 'test', password: await hashPassword('123456'), org_id: orgID, ph_num: '+917999999999'})
    console.log('Organisation and admin added successfully')
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()
