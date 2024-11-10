const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const Log = require('../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { addIssueEvent } = require('../../db/query')


exports.getIssuesController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssues(CONSTANTS.BUILDING_DATABASE),[orgID])
    for (const issue of issues) {
      const issuesEvents = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesEvent(CONSTANTS.BUILDING_DATABASE),[issue.id])
      issue.issuesEvents = issuesEvents
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | getIssuesController | Issues fetched successfully`)
    return sendHTTPResponse.success(response, issues)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getIssuesController | Error in fetching issues | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}
const saveFileToDisk = (file, destination) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(destination, file.fieldname + '-' + uuidv4() + '-' + file.originalname)
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) {
        return reject(err)
      }
      resolve(filePath)
    })
  })
}

exports.getIssuesUnderResidentController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const residentID = parseInt(request.params.id)
  const itemsPerPage = 3
  const pageNumber = request.query.pageNumber ? parseInt(request.query.pageNumber) : 0
  const offset = (pageNumber - 1) * itemsPerPage
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesUnderResident(CONSTANTS.BUILDING_DATABASE, itemsPerPage, offset),[residentID, orgID])
    for (const issue of issues) {
      const issuesEvents = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesEvent(CONSTANTS.BUILDING_DATABASE),[issue.id])
      issue.issuesEvents = issuesEvents
    }
    Log.info(`[${domain} | OrganisationID:${orgID} | residentID:${residentID}] | getIssuesUnderResidentController | Issues fetched for resident successfully`)
    return sendHTTPResponse.success(response, issues)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID} | residentID:${residentID}] | getIssuesUnderResidentController | Error in fetching issues | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}
exports.addIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const userType = request.userType
  try {
    const { projectID, residentID, apartmentID, serviceID, subServiceID } = request.body

    if (_.isEmpty(projectID)) {
      return sendHTTPResponse.error(response, 'project cannot be empty', null, 400)
    }
    if (_.isEmpty(residentID)) {
      return sendHTTPResponse.error(response, 'resident cannot be empty', null, 400)
    }
    if (_.isEmpty(apartmentID)) {
      return sendHTTPResponse.error(response, 'apartment cannot be empty', null, 400)
    }
    if (_.isEmpty(serviceID)) {
      return sendHTTPResponse.error(response, 'service cannot be empty', null, 400)
    }
    if (_.isEmpty(subServiceID)) {
      return sendHTTPResponse.error(response, 'subService cannot be empty', null, 400)
    }

    if (request.files && request.files.length > 0) {
      const destination = 'uploads/issues/'
      request.body.imgSrcPaths = []
      for (const file of request.files) {
        const savedFilePath = await saveFileToDisk(file, destination)
        request.body.imgSrcPaths.push(savedFilePath)
      }
    }
    const issueData = {
      org_id: orgID,
      apartment_id: apartmentID,
      resident_id: residentID,
      description: request.body.description ?? null,
      agent_id: null,
      creator_id: request.userID,
      creator_type: userType === CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN ? CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN : CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER,
      service_type: serviceID,
      service_subtype: subServiceID,
      issue_type: '',
      status: CONSTANTS.ISSUE_SUB_STATUS_NUM.CREATED,
      preferred_date: _.isEmpty(request.body.preferredDate) ? null : request.body.preferredDate,
      preferred_time: _.isEmpty(request.body.preferredTime) ? null : request.body.preferredTime,
      due_date: null,
      img_src: _.isEmpty(request.body.imgSrcPaths) ? null : (request.body.imgSrcPaths)?.join(','),
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addIssue(CONSTANTS.BUILDING_DATABASE), [issueData]))?.insertId
    const issueLogData = {
      issue_id : insertID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.CREATED,
      status : CONSTANTS.ISSUE_SUB_STATUS_NUM.CREATED,
      description : '',
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData])
    Log.info(`[${domain} | OrganisationID:${orgID}] | addIssueController | Issue added successfully | IssueID: ${insertID}`)
    return sendHTTPResponse.success(response, 'Issue added successfully', insertID)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching project list', error)
  }
}
