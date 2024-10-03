const runQuery = require('../db/runQuery')
const { BUILDING_DATABASE } = require('../lib/constants')

const addOrgQuery = `INSERT INTO ${BUILDING_DATABASE}.organisation (\`name\`, \`domain\`, \`config\`) VALUES ('Sreedhanya', 'sreedhanya', '{}')`

const main = async () => {
  try {
    await runQuery(BUILDING_DATABASE, addOrgQuery)
    console.log('Organisation added successfully')
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()
