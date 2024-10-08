const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const Fn = require('./function')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const bcrypt = require('bcrypt')
const { jwtDecode } = require('../../lib/jwtFn')

exports.loginController = async (request, response) => {
  const {username, password, userType} = request.body
  try{

    const allowedUserTypes = [CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN, CONSTANTS.SERVV_USER_TYPE_STRING.AGENT, CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER]

    if(!_.includes(allowedUserTypes, userType))
      return sendHTTPResponse.error(response, 'Invalid user type', null, 400)

    if(userType == CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN){
      const adminData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAdminData(CONSTANTS.BUILDING_DATABASE), [username])

      if(_.isEmpty(adminData))
        return sendHTTPResponse.error(response, 'Invalid credentials', null, 400)

      if(!await bcrypt.compare(password, adminData.password))
        return sendHTTPResponse.error(response, 'Invalid credentials', null, 400)

      const {error, data} = await Fn.generateAdminToken(adminData)
      if(error)
        return sendHTTPResponse.error(response, 'Error in generating admin token', null, 500)

// Refresh Token:
// The refreshToken is being stored in an HTTP-only cookie. This means it is stored on the client-side (in the browser), but it is not accessible via JavaScript 
// due to the httpOnly: true option. The secure: true flag ensures that this cookie will only be sent over HTTPS connections.
// Access Token:
// The accessToken is sent in the response body as JSON. This is typically stored in the frontend, often in the browser's memory (e.g., in a JavaScript variable,
// local storage, or session storage) depending on your implementation. However, storing tokens in local or session storage can expose them to JavaScript,
// making them vulnerable to cross-site scripting (XSS) attacks.
// const isProduction = process.env.NODE_ENV === 'production';
//       response.cookie('refreshToken', data.refreshToken, {
//         httpOnly: true,
//         secure: isProduction, // Set secure to true only in production
//         sameSite: isProduction ? 'None' : 'Lax',
//         path: '/',
//       })
      return response.json({ accessToken: data.accessToken, refreshToken: data.refreshToken }) 
      
    }
    sendHTTPResponse.error(response, 'Authentication not supported', null, 400)

  }catch(error){
    Log.error(`[Servv] | loginController | Error in login`)
    sendHTTPResponse.error(response, 'Error in login', error)
  }
}

exports.regenreateTokenController = async (request, response) => {
  const { refreshToken } = request.body
  try{
    const decoded = await jwtDecode(refreshToken)
    const adminID = decoded?.data?.id
    const adminData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAdminDataByID(CONSTANTS.BUILDING_DATABASE), [adminID])
    if(_.isEmpty(adminData))
      return sendHTTPResponse.error(response, 'Error in regenreate token', null, 400)

    const {error, data} = await Fn.generateAdminToken(adminData)
    if(error)
      return sendHTTPResponse.error(response, 'Error in generating admin token', null, 500)

     return response.json({ accessToken: data.accessToken, refreshToken: data.refreshToken }) 
  }catch(error){
    Log.error(`[Servv] | regenreateTokenController | Error in regenreate token`)
    sendHTTPResponse.error(response, 'Error in regenreate token', error)
  }
}
