const runQuery = require('../db/runQuery')
const runQueryOne = require('../db/runQueryOne')
const { BUILDING_DATABASE, SERVV_USER_TYPE_STRING } = require('../lib/constants')
const hashPassword = require('../lib/hashPassword')
const { jwtSign } = require('../lib/jwtFn')

const addOrgQuery = `INSERT INTO ${BUILDING_DATABASE}.organisation (\`name\`, \`domain\`, \`config\`) VALUES ('Sreedhanya', 'sreedhanya', '{}')`
const getAdminData = `SELECT * FROM ${BUILDING_DATABASE}.admin Where id=1`

const main = async () => {
  try {
    const data = await runQueryOne(BUILDING_DATABASE, getAdminData )
    const accessToken = await jwtSign({id:data.id,name:data.name, username:data.username, orgID:data.org_id, role:data.role_id, projectID:data.project_id, userType: SERVV_USER_TYPE_STRING.ADMIN})
    console.log(accessToken)
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()
