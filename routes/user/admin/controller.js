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
    Log.error(`[Servv | OrganisationID:${orgID}] | getUserController | Error in fetching admin list`)
    sendHTTPResponse.error(response, 'Error while fetching admin list', error)
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
    Log.info(`[Servv | OrganisationID:${orgID}] | editAdminController | AdminID:${id} | Admin updated successfully`)
    return sendHTTPResponse.success(response, 'Admin updated successfully')
  }
catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editAdminController | Error in fetching admin list`)
    return sendHTTPResponse.error(response, 'Error on editing admin', error)
  }
}