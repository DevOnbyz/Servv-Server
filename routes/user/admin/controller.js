
const runQuery = require('../../../db/runQuery')
const CONSTANTS = require('../../../lib/constants')
const Log = require('../../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const sendHTTPResponse = require('../../../lib/sendHTTPResponse')
const hashPassword = require('../../../lib/hashPassword')
const { getAllProjectsByOrgID } = require('../../../db/query')

exports.getUserController = async (request, response) => {
  const orgID = request.orgID
  try {
    const adminList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAdminsUnderOrg(CONSTANTS.BUILDING_DATABASE), [orgID])
    const projectNames = await runQuery(CONSTANTS.BUILDING_DATABASE, getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), orgID)
    const completeProject = projectNames.map((project) => ({id: project.id, name: project.name, city: project.city, district: project.district, state: project.state, country: project.country}))
    for (const admin of adminList) {
      const projectList = JSON.parse(admin.project_id)
      if (_.isEmpty(projectList)){
        admin.projectList = completeProject
        continue 
      }

      const projectDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getProjectsByIDs(CONSTANTS.BUILDING_DATABASE), [projectList])
      admin.projectList = projectDetails

    }
    return sendHTTPResponse.success(response, 'Fetched admin details successfully', adminList)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getUserController | Error in fetching project list`)
    sendHTTPResponse.error(response, 'Error while fetching project list', error)
  }
}
exports.addAdminController = async (request, response) => {
  const orgID = request.orgID
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const username = request.body.username
    const email = request.body.email
    const password = request.body.password
    const roleID = request.body.roleID
    const phNum = request.body.phNum
    const projectList = request.body.project
    const serviceList = request.body.serviceList ?? []

    const adminDetails = {
      firstname,
      lastname,
      username,
      email,
      role_id: roleID,
      org_id: orgID,
      ph_num: phNum,
      password: await hashPassword(password),
      project_id: JSON.stringify(projectList)
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAdmin(CONSTANTS.BUILDING_DATABASE), [adminDetails])
    Log.info(`[Servv | OrganisationID:${orgID}] addAdminController | Admin added successfully`)
    return sendHTTPResponse.success(response, 'Admin added successfully')
  } catch (error) {
    if(error.code === 'ER_DUP_ENTRY') return sendHTTPResponse.error(response, 'Admin already exists', error.message)

    Log.error(`[Servv | OrganisationID:${orgID}] | addAdminController | Error in fetching admin list`)
    return sendHTTPResponse.error(response, 'Error on adding admin', error.message)
  }
}
