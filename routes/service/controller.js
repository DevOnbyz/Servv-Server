const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')

exports.getServicesController = async (request, response) => {
  const orgID = request.orgID
  const state = request.query.state ?? null
  try {
    const services = state == 'active' ? await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllActiveServicesByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID]) : await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllServicesByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
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
    const description = request.body.description
    const serviceDataByName = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getServiceByName(CONSTANTS.BUILDING_DATABASE), [name])
    const serviceID = !_.isEmpty(serviceDataByName) ? serviceDataByName[0].id : (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addService(CONSTANTS.BUILDING_DATABASE), [{ name }]))?.insertId

    const isServiceAddedForOrg = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.isServiceAddedForOrg(CONSTANTS.BUILDING_DATABASE), [orgID, serviceID])
    if (!_.isEmpty(isServiceAddedForOrg)) {
      Log.error(`[Servv | OrganisationID:${orgID}] | addServicesController | Service already added for organisation`)
      return sendHTTPResponse.error(response, 'Service already added for organisation', null, 400)
    }
    const serviceRelDetails = {
      description,
      service_id: serviceID,
      org_id: orgID,
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
  const serviceOrgRelID = request.params.id
  try {
    const name = request.body.name?.toLowerCase()
    const description = request.body.description
    const status = request.body.status
    console.log({ name, description, status })
    const updateDetails = {}

    if (status !== undefined) updateDetails.status = status
    else {
      updateDetails.description = description
      if (!name) return sendHTTPResponse.error(response, 'Name is required', null, 400)

      const serviceDataByName = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getServiceByName(CONSTANTS.BUILDING_DATABASE), [name])
      const serviceID = !_.isEmpty(serviceDataByName) ? serviceDataByName[0].id : (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addService(CONSTANTS.BUILDING_DATABASE), [{ name }]))?.insertId
      updateDetails.service_id = serviceID
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateServiceOrgRel(CONSTANTS.BUILDING_DATABASE), [updateDetails, serviceOrgRelID])
    return sendHTTPResponse.success(response, 'Service updated successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationRelID:${serviceOrgRelID} | Error in updating service list`)
    return sendHTTPResponse.error(response, 'Error on updating service', error)
  }
}
