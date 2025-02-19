const sendHTTPResponse = require('../lib/sendHTTPResponse')
const jwt = require('jsonwebtoken')
const CONSTANTS = require('../lib/constants')
const Log = require('../log')

module.exports = async (request, response, next) => {
  const authHeader = request.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return sendHTTPResponse.error(response, 'Unauthorized', null, 401)

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
    request.userType = decoded?.data?.userType
    if(request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER){
      request.orgID = request.query.organisationID
      request.userID = decoded?.data?.associatedOrganisation?.filter(org => org.id == request.orgID)[0]?.residentID
      request.domain = decoded?.data?.associatedOrganisation?.filter(org => org.id == request.orgID)[0]?.name
      request.name = decoded?.data?.name
      request.associatedOrganisation = decoded?.data?.associatedOrganisation
      if(!request.orgID) return sendHTTPResponse.error(response, 'Organisation ID not found', null, 403)
      next()
    }
    if(request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN){
      request.orgID = decoded?.data?.orgID
      request.username = decoded?.data?.username
      request.userID = decoded?.data?.id
      request.domain = decoded?.data?.domain
      next()
    }
    if(request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.AGENT){
      request.orgID = request.query.organisationID
      request.userID = decoded?.data?.associatedOrganisation?.filter(org => org.id == request.orgID)[0]?.agentID
      request.identityID = decoded?.data?.identityID
      request.domain = decoded?.data?.associatedOrganisation?.filter(org => org.id == request.orgID)[0]?.name
      request.name = decoded?.data?.name
      request.associatedOrganisation = decoded?.data?.associatedOrganisation
      if(!request.orgID) return sendHTTPResponse.error(response, 'Organisation ID not found', null, 403)
      next()
    }
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendHTTPResponse.error(response, 'Token Expired', { needRefresh: true }, 403)
    }
    Log.error(`[Servv] | authenticationMiddleware | Error in authentication middleware | ${error.message}`)
    return sendHTTPResponse.error(response, 'Invalid Token', null, 403)
  }
}
