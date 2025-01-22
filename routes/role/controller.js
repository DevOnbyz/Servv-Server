const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')


exports.getAllRoleUnderOrg = async (request, response) => {
  const orgID = request.orgID
  try {
    const roles = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getRolesUnderOrgByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    return sendHTTPResponse.success(response, 'Roles List fetched successfully', roles)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getAllRoleUnderOrg | Error in fetching role | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching role', error.message)
  }
}
