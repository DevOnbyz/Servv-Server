const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const { jwtSign } = require('../../lib/jwtFn')

exports.generateAdminToken = async (adminData) => {
  try{
    const id = adminData.id
    const firstname = adminData.firstname
    const lastname = adminData.lastname
    const username = adminData.username
    const orgID = adminData.org_id
    const role = adminData.role_id ?? null
    const projectID = adminData.project_id ?? null
    const accessToken = await jwtSign({id,name: `${firstname} ${lastname}`, username, orgID, role, projectID, userType: CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN}, {expiresIn: CONSTANTS.ACCESS_TOKEN_EXPIRY})
    const refreshToken = await jwtSign({id}, {expiresIn: CONSTANTS.REFRESH_TOKEN_EXPIRY})
    return {error: false, data:{accessToken, refreshToken}}
  }
  catch(error){
    Log.error(`[Servv] | generateAdminToken | Error in generating admin token`)
    return {error: true, data: null}
  }
  
}
