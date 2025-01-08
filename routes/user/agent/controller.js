const runQuery = require('../../../db/runQuery')
const CONSTANTS = require('../../../lib/constants')
const Log = require('../../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const sendHTTPResponse = require('../../../lib/sendHTTPResponse')
const hashPassword = require('../../../lib/hashPassword')
const { getAllProjectsByOrgID, getAllServicesUnderSystem } = require('../../../db/query')
const runQueryOne = require('../../../db/runQueryOne')

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
exports.getAgentByIDController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const agentID = request.params.id

  try {
    const agentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentDetailsByID(CONSTANTS.BUILDING_DATABASE), [agentID])
    const serviceList = (await runQuery(CONSTANTS.BUILDING_DATABASE, getAllServicesUnderSystem(CONSTANTS.BUILDING_DATABASE)))?.map((item) => ({ id: item.id, name: item.name }))
    for (const agent of agentDetails) {
      const associatedServices = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getDistinctServiceAgentMappingByAgentID(CONSTANTS.BUILDING_DATABASE), [agent.id]))?.map((item) => item.service_id)
      agent.serviceList = serviceList.filter((service) => _.includes(associatedServices, service.id))
    }
    return sendHTTPResponse.success(response, 'Fetched agent details successfully', agentDetails)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getAgentByIDController | Error in fetching agent details`)
    sendHTTPResponse.error(response, 'Error while fetching agent details', error)
  }
}
exports.getAgentsByServiceController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const serviceID = request.params.serviceID
  try {
    const agentIDUnderService = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAgentsUnderServiceID(CONSTANTS.BUILDING_DATABASE), [serviceID]))?.map((item) => item.agent_id)

    if (_.isEmpty(agentIDUnderService)) return sendHTTPResponse.error(response, 'No agent found under this service', [], 400)

    const agentList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAgentsByAgentIDandOrg(CONSTANTS.BUILDING_DATABASE), [agentIDUnderService, orgID])
    for (const agent of agentList) {
      agent.activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitCountByAgentID(CONSTANTS.BUILDING_DATABASE), [agent.id]))?.activeSiteVisit ?? 0
      agent.activeWorkLoad = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveWorkLoadByCountAgentID(CONSTANTS.BUILDING_DATABASE), [agent.id]))?.activeWorkLoad ?? 0
    }
    return sendHTTPResponse.success(response, 'Fetched agent details under service successfully', agentList)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getAgentsByServiceController | Error in fetching agent under service list`)
    sendHTTPResponse.error(response, 'Error while fetching agent under service list', error)
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
    if (error.code === 'ER_DUP_ENTRY') return sendHTTPResponse.error(response, 'Agent already exists', error.message)

    Log.error(`[${domain} | OrganisationID:${orgID}] | addAgentController | Error in fetching agent list`)
    return sendHTTPResponse.error(response, 'Error on adding agent', error.message)
  }
}

exports.editAgentController = async (request, response) => {
  const orgID = request.orgID
  const id = request.params.id
  const userID = request.userID
  const domain = request.domain
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const email = request.body.email ?? null
    const phNum = request.body.phNum
    const serviceList = request.body.serviceList
    const city = request.body.city
    const district = request.body.district ?? null
    const state = request.body.state ?? null
    const country = request.body.country ?? null

    const agentDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentDetailsByID(CONSTANTS.BUILDING_DATABASE), [id])
    const agentEntityID = agentDetails?.identity_id

    const newAgentDetails = {
      firstname,
      lastname,
      email_id: email,
      updated_by: userID,
      org_id: orgID,
      city,
      district,
      state,
      country
    }
    const existingServiceList = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllServicesByAgentID(CONSTANTS.BUILDING_DATABASE), [id]))?.map((item) => (item.service_id))
    const newServiceList = _.difference(serviceList, existingServiceList)
    const deactivatedServiceList = _.difference(existingServiceList, serviceList)
    if (!_.isEmpty(deactivatedServiceList)) {
      await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.deleteAgentServiceRelByAgentIDAndServiceIDs(CONSTANTS.BUILDING_DATABASE), [id, deactivatedServiceList])
    }
    if (!_.isEmpty(newServiceList)) {
      for (const service of newServiceList) {
        const agentServiceDetails = {
          service_id: service,
          agent_id: id,
          created_by: userID
        }
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentServiceRel(CONSTANTS.BUILDING_DATABASE), [agentServiceDetails])
      }
    }
    // Check if a agent having same phone number exists in a same organisation then the admin cant add agent again
    const phNumDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum]) //getting identity id of the phone number entered
    if (!_.isEmpty(phNumDetails)) { // if a agent having same phone number exists in agent identity table
      const agentOrgDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentByPhNumIDAndOrgID(CONSTANTS.BUILDING_DATABASE), [phNumDetails?.id, orgID])
      if (!_.isEmpty(agentOrgDetails) && agentOrgDetails?.identity_id !== agentEntityID) return sendHTTPResponse.error(response, 'Agent with same phone number already exists in this organisation', null, 400)

      // if a agent having same phone number exists in another organisation then the agent can update the identity id
      const updatedAgentIdentityId = phNumDetails?.id
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentDetailsByID(CONSTANTS.BUILDING_DATABASE), [{ ...newAgentDetails, identity_id: updatedAgentIdentityId }, id])
    } else {
      const newAgentIdentityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum, created_by: userID }]))?.insertId
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentDetailsByID(CONSTANTS.BUILDING_DATABASE), [{ ...newAgentDetails, identity_id: newAgentIdentityID }, id])
    }
    return sendHTTPResponse.success(response, 'Agent updated successfully')
  }
  catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | editAgentController | Error in fetching agent list`)
    return sendHTTPResponse.error(response, 'Error on editing admin', error)
  }
}

exports.getAgentAssignmentsController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const userID = request.userID
  const isActive = request.query.isActive == 'true'
  const assignmentType = request.query.assignmentType

  try {
    const agentList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAgentAssignments(CONSTANTS.BUILDING_DATABASE, isActive, assignmentType), [userID]) ?? []
    return sendHTTPResponse.success(response, 'Fetched agent details successfully', agentList)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getAgentsAssignmentsController | Error in fetching agent list`)
    sendHTTPResponse.error(response, 'Error while fetching agent list', error)
  }
}

exports.getAssignmentByIDController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const userID = request.userID 
  const assignmentID = request.params.assignmentID
  try {
    const detailedAssignment = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getDetailedAssignmentUnderAgentByAssignmentID(CONSTANTS.BUILDING_DATABASE), [assignmentID, userID])
    normalizedAgentList = {
      ...detailedAssignment,
      agent_uploads: Array.isArray(detailedAssignment.agent_uploads) ? detailedAssignment.agent_uploads : detailedAssignment.agent_uploads ? [detailedAssignment.agent_uploads] : [],
      issueImages: Array.isArray(detailedAssignment.issueImages) ? detailedAssignment.issueImages : detailedAssignment.issueImages ? [detailedAssignment.issueImages] : []
    }
    return sendHTTPResponse.success(response, 'Fetched assignment details successfully', normalizedAgentList)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getAssignmentByIDController | Error in fetching assignment details`, error)
    sendHTTPResponse.error(response, 'Error while fetching assignment details', error)
  }
}