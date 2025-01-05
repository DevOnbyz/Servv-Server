const runQuery = require('../db/runQuery')
const runQueryOne = require('../db/runQueryOne')
const { BUILDING_DATABASE, SERVV_USER_TYPE_STRING } = require('../lib/constants')
const { generateAgentToken } = require('../routes/auth/function')
const { getAgentData } = require('../routes/auth/query')
const _ = require('lodash')

const getCliArguments = () => {
    const args = process.argv.slice(2)
    const cliOptions = {}
  args.forEach((arg, index) => {
      if (arg.startsWith('--phoneNumber=')) 
        cliOptions.phoneNumber = arg.split('=')[1]
    })
  
    if (!cliOptions.phoneNumber) {
      console.error("Please provide all required arguments: --phoneNumber")
      process.exit(1)
    }
  
    return cliOptions
  }
const main = async () => {
  try {
    const cliOptions = getCliArguments()
    const customerData = await runQueryOne(BUILDING_DATABASE, getAgentData(BUILDING_DATABASE), [cliOptions.phoneNumber])
    if(_.isEmpty(customerData))
        return console.log('Agent account not found')
    const {error, data} = await generateAgentToken(customerData)

    if(error)
        throw error

    console.log(data)
  } catch (error) {
    console.error('Error in generating agent token:', error)
  }
}

main()
// node scripts/generateAgentToken.js --phoneNumber=+917994771185