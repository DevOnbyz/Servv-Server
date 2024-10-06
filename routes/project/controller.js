const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const { getAllServicesByOrgID } = require('../service/query')
const Log = require('../../log')
const _ = require('lodash')
const queryBuilder = require('./query')

exports.getProjectsController = async (request, response) => {
  const orgID = request.orgID
  try {
    const projects = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    for (const project of projects) {
      const serviceList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllActiveServicesByProject(CONSTANTS.BUILDING_DATABASE), [project.id])
      project.serviceList = serviceList // Add serviceList to the project
    }
    return sendHTTPResponse.success(response, 'Project List fetched successfully', projects)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getProjectsController | Error in fetching project list`)
    sendHTTPResponse.error(response, 'Error while fetching project list', error)
  }
}
exports.addProjectController = async (request, response) => {
  const orgID = request.orgID
  try {
    const name = request.body.name?.toLowerCase()
    const city = request.body.city?.toLowerCase()
    const district = request.body.district?.toLowerCase()
    const state = request.body.state?.toLowerCase()
    const country = request.body.country?.toLowerCase()
    const serviceList = request.body.serviceList
    const floors = request.body.floors ? parseInt(request.body.floors) : null
    const gmapLink = request.body.gmap_link
    const description = request.body.description

    const projectDetails = {
      name,
      city,
      district,
      state,
      country,
      floors,
      description,
      org_id: orgID,
      gmap_link: gmapLink,
    }

    const getAllProjectUnderOrg = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    const projectDataByName = getAllProjectUnderOrg.find((item) => item.name === name)
    if (!_.isEmpty(projectDataByName)) {
      Log.error(`[Servv | OrganisationID:${orgID}] | addProjectController | Project already added for organisation`)
      return sendHTTPResponse.error(response, 'Project already added for organisation', null, 400)
    }

    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addProjectToOrg(CONSTANTS.BUILDING_DATABASE), [projectDetails]))?.insertId

    for (const serviceOrgRelID of serviceList) {
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addprojectServiceRel(CONSTANTS.BUILDING_DATABASE), [{ service_id: serviceOrgRelID, project_id: insertID }])
    }
    
    Log.info(`[Servv | OrganisationID:${orgID}] addProjectController| insertID: ${insertID} | Project: ${name} | Project added successfully`)
    return sendHTTPResponse.success(response, 'Project added successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | addProjectController | Error in fetching project list`)
    return sendHTTPResponse.error(response, 'Error on adding project', error)
  }
}

exports.editProjectController = async (request, response) => {
  const orgID = request.orgID
  const projectID = parseInt(request.params.id)
  try {
    const city = request.body.city?.toLowerCase()
    const district = request.body.district?.toLowerCase()
    const state = request.body.state?.toLowerCase()
    const country = request.body.country?.toLowerCase()
    const floors = request.body.floors ? parseInt(request.body.floors) : null
    const gmapLink = request.body.gmap_link
    const description = request.body.description
    const serviceList = request.body.serviceList
    
    const activeServiceOnProjectList = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllActiveServicesByProject(CONSTANTS.BUILDING_DATABASE), [projectID]))?.map((item) => (item.id))

    // Get the difference between serviceList and addedProjectServiceList to get deactivatedProjectServiceList and newProjectServiceList
    const newProjectServiceList = _.difference(serviceList, activeServiceOnProjectList)
    const deactivatedProjectServiceList = _.difference(activeServiceOnProjectList, serviceList)
    const completeProjectServiceIDs = [...newProjectServiceList, ...deactivatedProjectServiceList]
    if(!_.isEmpty(completeProjectServiceIDs)) {
      for (const serviceForProjectID of completeProjectServiceIDs) {
        // serviceForProjectID is the service id associated with orgainsation
        const projectServiceRel = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.isServiceAddedForProject(CONSTANTS.BUILDING_DATABASE), [projectID, serviceForProjectID])
        if(_.isEmpty(projectServiceRel)) await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addprojectServiceRel(CONSTANTS.BUILDING_DATABASE), [{ service_id: serviceForProjectID, project_id: projectID }])
        else await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateprojectServiceRel(CONSTANTS.BUILDING_DATABASE), [{status: projectServiceRel[0].status===1 ? 0 : 1}, projectID, serviceForProjectID])

      }
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateProject(CONSTANTS.BUILDING_DATABASE), [{ city, district, state, country, floors, description, gmap_link: gmapLink }, projectID])
    return sendHTTPResponse.success(response, 'Project updated successfully')

  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editProjectController | projectID:${projectID} | Error in updating project list`)
    return sendHTTPResponse.error(response, 'Error on updating project', error)
  }
}
