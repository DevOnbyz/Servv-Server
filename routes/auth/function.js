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
    const orgDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getOrgDetails(CONSTANTS.BUILDING_DATABASE), [orgID])
    const domain = orgDetails.domain
    const orgName = orgDetails.name
    const accessToken = await jwtSign({id,name: `${firstname} ${lastname}`, username, orgID, domain, orgName, role, projectID, userType: CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN}, {expiresIn: CONSTANTS.ACCESS_TOKEN_EXPIRY})
    const refreshToken = await jwtSign({id}, {expiresIn: CONSTANTS.REFRESH_TOKEN_EXPIRY})
    return {error: false, data:{accessToken, refreshToken}}
  }
  catch(error){
    Log.error(`[Servv] | generateAdminToken | Error in generating admin token`)
    return {error: true, data: null}
  }
  
}

const generateCustomerToken = async (customerData) => {
  try{
    const id = customerData.id
    const identityID = customerData.identity_id
    const firstname = customerData.firstname
    const lastname = customerData.lastname
    const associatedOrganisationList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getDistichOrgOfResidentsByIdentityID(CONSTANTS.BUILDING_DATABASE), [identityID])
    const orgIDs = associatedOrganisationList?.map(org => org.org_id)
    const orgsDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getOrgDetailsByIDs(CONSTANTS.BUILDING_DATABASE), [orgIDs])
    const associatedOrganisation = orgsDetails?.map((org) => ({
      id: org.id,
      name: org.domain,
      residentID: associatedOrganisationList?.find((resident) => resident.org_id === org.id)?.residentId,
    }))
    const orgDomains = (orgsDetails?.map(org => org.domain))?.join(',')
    const domain = `MOBILE-${orgDomains}`
    
    const accessToken = await jwtSign({id, name: `${firstname} ${lastname}`, identityID, domain, associatedOrganisation, userType: CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER})
    return {error: false, data:{accessToken}}
  }
  catch(error){
    Log.error(`[Servv] | generateCustomerToken | Error in generating customer token`)
    return {error: true, data: null}
  }
  
}