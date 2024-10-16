const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')

exports.getServicesController = async (request, response) => {
  const orgID = request.orgID
  const state = request.query.state ?? null
  try {
    const services =
      state == 'active'
        ? await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllActiveServicesByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
        : await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllServicesByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    return sendHTTPResponse.success(response, 'Service List fetched successfully', services)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getServicesController | Error in fetching service list`)
    sendHTTPResponse.error(response, 'Error while fetching service list', error)
  }
}
exports.addServicesController = async (request, response) => {
  const orgID = request.orgID
  try {
    const name = request.body.name?.toLowerCase()
    const type = request.body.type
    const description = request.body.description
    const serviceData = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getServiceByID(CONSTANTS.BUILDING_DATABASE), [type])
    if (_.isEmpty(serviceData)) return sendHTTPResponse.error(response, 'Invalid service type', null, 400)
      
      const serviceRelDetails = {
        name,
        description,
        service_type: type,
        org_id: orgID,
      }
      
    const serviceDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getServiceAddedForOrgByName(CONSTANTS.BUILDING_DATABASE), [orgID, name])

    if((serviceDetails?.name)?.toLowerCase() === name?.toLowerCase()){
      Log.error(`[Servv | OrganisationID:${orgID}] | addServicesController | Service already added for organisation`)
      return sendHTTPResponse.error(response, 'This service name is already added for organisation', null, 400)
    }

    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addServiceToOrg(CONSTANTS.BUILDING_DATABASE), [serviceRelDetails]))?.insertId
    return sendHTTPResponse.success(response, 'Service added successfully', { serviceID: insertID })
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | addServicesController | Error in fetching service list`)
    return sendHTTPResponse.error(response, 'Error on adding service', error)
  }
}

exports.editServicesController = async (request, response) => {
  const orgID = request.orgID
  const serviceOrgRelID = parseInt(request.params.id)
  try {
    const description = request.body.description
    const name = request.body.name
    const status = request.body.status
    const type = request.body.type

    const updateDetails = {}
    if (status !== undefined) {
      updateDetails.status = status
      const projectList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
      if (!_.isEmpty(projectList)) {
        for (project of projectList) {
          const projectID = project?.id
          const projectRelData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getProjectServiceRelData(CONSTANTS.BUILDING_DATABASE), [projectID, type])
          if (!_.isEmpty(projectRelData)) {
            // if that project already has that service then update the project status
            Log.info(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationServiceRelID:${serviceOrgRelID} | Updating Project status`)
            await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateProjectServiceRel(CONSTANTS.BUILDING_DATABASE), [{ status }, projectRelData.id])
          }
        }
      }
    } else {
      updateDetails.description = description
      updateDetails.service_type = type
      updateDetails.name = name
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateServiceOrgRel(CONSTANTS.BUILDING_DATABASE), [updateDetails, serviceOrgRelID])
    return sendHTTPResponse.success(response, 'Service updated successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationRelID:${serviceOrgRelID} | Error in updating service list`)
    return sendHTTPResponse.error(response, 'Error on updating service', error.message)
  }
}


exports.getServiceTypeController = async (request, response) => {
  const orgID = request.orgID
  try {
    const serviceTypes = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getServiceType(CONSTANTS.BUILDING_DATABASE), [orgID])
    return sendHTTPResponse.success(response, 'Service type List fetched successfully', serviceTypes)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getServicesController | Error in fetching service type list`)
    sendHTTPResponse.error(response, 'Error while fetching service type list', error.message)
  }
}
