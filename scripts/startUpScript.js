const runQuery = require('../db/runQuery')
const { BUILDING_DATABASE } = require('../lib/constants')
const hashPassword = require('../lib/hashPassword')

const addOrgQuery = `INSERT INTO ${BUILDING_DATABASE}.organisation (\`name\`, \`domain\`, \`config\`) VALUES ('Sreedhanya', 'sreedhanya', '{}')`
const addManager = `INSERT INTO ${BUILDING_DATABASE}.manager SET ?`

const main = async () => {
  try {
    const orgID = (await runQuery(BUILDING_DATABASE, addOrgQuery))?.insertId
    await runQuery(BUILDING_DATABASE, addManager , {name: 'testUser', username: 'test', password: await hashPassword('123456'), org_id: orgID})
    console.log('Organisation and manager added successfully')
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()
