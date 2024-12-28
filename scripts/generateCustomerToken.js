const runQuery = require('../db/runQuery')
const runQueryOne = require('../db/runQueryOne')
const { BUILDING_DATABASE, SERVV_USER_TYPE_STRING } = require('../lib/constants')
const hashPassword = require('../lib/hashPassword')
const { jwtSign } = require('../lib/jwtFn')
const { generateCustomerToken } = require('../routes/auth/function')
const { getCustomerData } = require('../routes/auth/query')
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
    const customerData = await runQueryOne(BUILDING_DATABASE, getCustomerData(BUILDING_DATABASE), [cliOptions.phoneNumber])
    if(_.isEmpty(customerData))
        return console.log('Resident account not found')
    const {error, data} = await generateCustomerToken(customerData)

    if(error)
        throw error

    console.log(data)
  } catch (error) {
    console.error('Error adding organisation:', error)
  }
}

main()
