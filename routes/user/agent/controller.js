const runQuery = require('../../../db/runQuery')
const CONSTANTS = require('../../../lib/constants')
const Log = require('../../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const sendHTTPResponse = require('../../../lib/sendHTTPResponse')
const hashPassword = require('../../../lib/hashPassword')
const { getAllProjectsByOrgID, getAllServicesUnderSystem } = require('../../../db/query')

exports.getAgentController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const agentList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAgentsUnderOrg(CONSTANTS.BUILDING_DATABASE), [orgID])
    const serviceList = (await runQuery(CONSTANTS.BUILDING_DATABASE, getAllServicesUnderSystem(CONSTANTS.BUILDING_DATABASE)))?.map((item) => ({ id: item.id, name: item.name }))
    for (const agent of agentList) {
      const associatedServices = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getDistinctServiceAgentMappingByAgentID(CONSTANTS.BUILDING_DATABASE), [agent.id]))?.map((item) => item.service_id)
      agent.serviceList = serviceList.filter((service) => _.includes(associatedServices, service.id))
    }
    return sendHTTPResponse.success(response, 'Fetched agent details successfully', agentList)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getAgentController | Error in fetching agent list`)
    sendHTTPResponse.error(response, 'Error while fetching agent list', error)
  }
}

exports.addAgentController = async (request, response) => {
  const orgID = request.orgID
  const userID = request.userID
  const domain = request.domain
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const email = request.body.email ?? null
    const phNum = request.body.phNum
    const serviceList = request.body.serviceList ?? []
    const city = request.body.city ?? null
    const district = request.body.district ?? null
    const state = request.body.state ?? null
    const country = request.body.country ?? null
    // return sendHTTPResponse.success(response, 'Admin added successfully')
    const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])
    const agentIdentityID = _.isEmpty(phNumDetails) ? (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum, created_by: userID }]))?.insertId : phNumDetails[0]?.id

    if (!_.isEmpty(phNumDetails)) {
      // if a agent having same phone number exists in a same organisation then the admin cant add agent again
      const agentOrgDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentByPhNumIDAndOrgID(CONSTANTS.BUILDING_DATABASE), [agentIdentityID, orgID])
      if (!_.isEmpty(agentOrgDetails)) return sendHTTPResponse.error(response, 'Agent with same phone number already exists in this organisation', null, 400)
    }

    const agentDetails = {
      firstname,
      lastname,
      email_id: email,
      updated_by: userID,
      org_id: orgID,
      identity_id: agentIdentityID,
      city,
      district,
      state,
      country,
      created_by: userID
    }

    const agentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgent(CONSTANTS.BUILDING_DATABASE), [agentDetails]))?.insertId

    for (const service of serviceList) {
      const agentServiceDetails = {
        service_id: service,
        agent_id: agentID,
        created_by: userID
      }
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentServiceRel(CONSTANTS.BUILDING_DATABASE), [agentServiceDetails])
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | addAgentController | Agent added successfully | AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'Agent added successfully')
  } catch (error) {
    console.log(error)
    if(error.code === 'ER_DUP_ENTRY') return sendHTTPResponse.error(response, 'Agent already exists', error.message)

    Log.error(`[${domain} | OrganisationID:${orgID}] | addAdminController | Error in fetching agent list`)
    return sendHTTPResponse.error(response, 'Error on adding agent', error.message)
  }
}

exports.editAdminController = async (request, response) => {
  const orgID = request.orgID
  const id = request.params.id
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const username = request.body.username
    const email = request.body.email
    const roleID = request.body.roleID
    const phNum = request.body.phNum
    const projectList = request.body.project
    const isPassordChanged = !!request.body.isPasswordChanged
    const password = request.body.password
    const serviceList = request.body.serviceList ?? []

    const adminDetails = {
      firstname,
      lastname,
      username,
      email,
      role_id: roleID,
      ph_num: phNum,
      project_id: JSON.stringify(projectList)
    }

    if (isPassordChanged) {
      adminDetails.password = await hashPassword(password)
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAdminDetails(CONSTANTS.BUILDING_DATABASE), [adminDetails, id])
    Log.info(`[${domain} | OrganisationID:${orgID}] | editAdminController | AdminID:${id} | Admin updated successfully`)
    return sendHTTPResponse.success(response, 'Admin updated successfully')
  }
catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | editAdminController | Error in fetching admin list`)
    return sendHTTPResponse.error(response, 'Error on editing admin', error)
  }
}