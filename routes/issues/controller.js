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
const { generateOTP } = require('../../lib/function')
const moment = require('moment')

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
    return sendHTTPResponse.success(response, 'Issues fetched successfully', issues)
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
      status: CONSTANTS.ISSUE_STATUS.OPEN,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.CREATED,
      preferred_date: _.isEmpty(request.body.preferredDate) ? null : request.body.preferredDate,
      preferred_time: _.isEmpty(request.body.preferredTime) ? null : request.body.preferredTime,
      due_date: null,
      img_src: _.isEmpty(request.body.imgSrcPaths) ? null : (request.body.imgSrcPaths)?.join(','),
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addIssue(CONSTANTS.BUILDING_DATABASE), [issueData]))?.insertId
    const issueLogData = {
      issue_id : insertID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.CREATED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.CREATED,
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


exports.scheduleVisitIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { agentID, notes, scheduleTime } = request.body
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])

    const agentAssignmentData = {
      issue_id: issueID,
      agent_id: agentID,
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.PENDING,
      assigned_by : request.userID,
      visit_scheduled_time : scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null,
      otp_sent_time: null,
      otp_code : generateOTP(),
      notes
    }
    const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentAssignment(CONSTANTS.BUILDING_DATABASE), [ agentAssignmentData, issueID ]))?.insertId

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.AGENT_ASSIGNED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED,
      entity_id: entityID,
      description : notes,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | scheduleVisitIssueController | Issue visit scheduled successfully | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Issue visit scheduled successfully', {entityID, logID})
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | scheduleVisitIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while scheduling issue visit', error.message)
  }
}


exports.workOrderIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { agentID, notes, scheduleTime } = request.body
    const notAllowedSubStatusForWorkOrder = [CONSTANTS.ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.COMPLETED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForWorkOrder.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status for work order')

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])

    const agentAssignmentData = {
      issue_id: issueID,
      agent_id: agentID,
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.PENDING,
      assigned_by : request.userID,
      visit_scheduled_time : scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null,
      otp_sent_time: null,
      otp_code : generateOTP(),
      notes
    }
    const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentAssignment(CONSTANTS.BUILDING_DATABASE), [ agentAssignmentData, issueID ]))?.insertId

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.WORK_ASSIGNED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED,
      entity_id: entityID,
      description : notes,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | workOrderIssueController | Work order added successfully | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Work order added successfully', {entityID, logID})
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | workOrderIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding work order', error.message)
  }
}

exports.getSiteVisitUnderIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const siteVisit = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getSiteVisitUnderIssue(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getSiteVisitUnderIssueController | Site visit fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Site visit fetched successfully', siteVisit)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getSiteVisitUnderIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching site visit', error.message)
  }
}

exports.getWorkOrderUnderIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const siteVisit = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getWorkOrderUnderIssue(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getWorkOrderUnderIssueController | Work order fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Work order fetched successfully', siteVisit)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getWorkOrderUnderIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching work order', error.message)
  }
}

exports.reAssignSiteVisitController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const agentID = request.body.agentID
  try {
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.AGENT_ASSIGNED
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentIDInAgentAssignmentofActiveIssue(CONSTANTS.BUILDING_DATABASE), [ agentID, issueID ])
    Log.info(`[${domain} | OrganisationID:${orgID}] | reAssignSiteVisitController | Issue re-assigned successfully | IssueID: ${issueID} to AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'Issue re-assigned successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | reAssignSiteVisitController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while re-assigning issue', error.message)
  }
}