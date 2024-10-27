const runQuery = require('../db/runQuery')
const { BUILDING_DATABASE } = require('../lib/constants')
const hashPassword = require('../lib/hashPassword')

const getCliArguments = () => {
  const args = process.argv.slice(2)
  const cliOptions = {}

  args.forEach((arg, index) => {
    if (arg.startsWith('--name=')) cliOptions.name = arg.split('=')[1]
    if (arg.startsWith('--domain=')) cliOptions.domain = arg.split('=')[1]
    if (arg.startsWith('--username=')) cliOptions.username = arg.split('=')[1]
    if (arg.startsWith('--password=')) cliOptions.password = arg.split('=')[1]
  })

  if (!cliOptions.name || !cliOptions.domain || !cliOptions.username || !cliOptions.password) {
    console.error("Please provide all required arguments: --name, --domain, --username, --password")
    process.exit(1)
  }

  return cliOptions
}

const main = async () => {
  const { name, domain, username, password } = getCliArguments()

  const addOrgQuery = `INSERT INTO ${BUILDING_DATABASE}.organisation (\`name\`, \`domain\`, \`config\`) VALUES (?, ?, '{}')`
  const addManager = `INSERT INTO ${BUILDING_DATABASE}.admin SET ?`

  try {
    const orgID = (await runQuery(BUILDING_DATABASE, addOrgQuery, [name, domain]))?.insertId
    const managerData = {
      firstname: 'test',
      lastname: 'user',
      username,
      password: await hashPassword(password),
      org_id: orgID,
      ph_num: '+917999999999'
    }
    
    await runQuery(BUILDING_DATABASE, addManager, managerData)
    console.log('Organisation and admin added successfully')
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()

// To run the code
// node scripts/startUpScript.js --name=Artech --domain=artech --username=batest --password=123456