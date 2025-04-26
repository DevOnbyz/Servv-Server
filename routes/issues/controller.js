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
const { getAgentDetailsByID } = require('../user/agent/query')
const { generateOTP, getSubStatusStringById, blastPushNotification } = require('../../lib/function')
const moment = require('moment')
const momentTZ = require('moment-timezone')
const runQueryOne = require('../../db/runQueryOne')
const Fn = require('./functions')
const { convertToUTC } = require('../announcement/functions')

exports.getIssuesController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssues(CONSTANTS.BUILDING_DATABASE), [orgID])

    for (const issue of issues) {
      issue.img_src = issue.img_src?.split(',')
      const issuesEvents = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesEvent(CONSTANTS.BUILDING_DATABASE), [issue.id])
      issue.issuesEvents = issuesEvents
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | getIssuesController | Issues fetched successfully`)
    return sendHTTPResponse.success(response, 'Issues fetched successfully', issues)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getIssuesController | Error in fetching issues | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}

exports.getIssueStatController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const issueStat = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueStat(CONSTANTS.BUILDING_DATABASE), [orgID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getIssueStatController | Issue stat fetched successfully`)
    return sendHTTPResponse.success(response, 'Issue stat fetched successfully', issueStat)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getIssueStatController | Error in fetching issue stat | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}

exports.getIssuesUnderResidentController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const residentID = parseInt(request.params.id)
  const itemsPerPage = request.query.itemsPerPage ? parseInt(request.query.itemsPerPage) : 3
  const pageNumber = request.query.pageNumber ? parseInt(request.query.pageNumber) : 0
  const offset = (pageNumber - 1) * itemsPerPage
  const isCustomer = request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesUnderResident(CONSTANTS.BUILDING_DATABASE, itemsPerPage, offset), [residentID, orgID])
    for (const issue of issues) {
      const lastCompletetedWorkOrder = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getCompletedWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issue.id])
      const activeAgentAssignment = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveAgentAssignment(CONSTANTS.BUILDING_DATABASE), [issue.id])
      issue.agentOTP = activeAgentAssignment ? activeAgentAssignment.otp_code : null
      issue.img_src = issue.img_src ? issue.img_src.split(',') : null
      const issueEventQuery = isCustomer ? queryBuilder.getIssuesEventForCustomer(CONSTANTS.BUILDING_DATABASE) : queryBuilder.getIssuesEvent(CONSTANTS.BUILDING_DATABASE)
      issue.isWorkFeedbackCompleted = lastCompletetedWorkOrder?.is_satisfied != CONSTANTS.SATISFACTION_STATUS.PENDING
      const issuesEvents = await runQuery(CONSTANTS.BUILDING_DATABASE, issueEventQuery, [issue.id])
      issue.reviewed = issue.reviewed === CONSTANTS.REVIEW_STATUS.COMPLETED
      issue.issuesEvents = issuesEvents
    }
    Log.info(`[${domain} | OrganisationID:${orgID} | residentID:${residentID}] | getIssuesUnderResidentController | Issues fetched for resident successfully`)
    return sendHTTPResponse.success(response, 'Issues fetched for resident successfully', issues)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID} | residentID:${residentID}] | getIssuesUnderResidentController | Error in fetching issues | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}

exports.getIssueByIDController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = parseInt(request.params.issueID)
  const isCustomer = request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER

  try {
    const issue = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueByID(CONSTANTS.BUILDING_DATABASE), [issueID, orgID])
    const lastCompletetedWorkOrder = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getCompletedWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])

    if (!issue) {
      Log.info(`[${domain} | OrganisationID:${orgID}  issueID:${issueID}] | getSingleIssueUnderResidentController | Issue not found`)
      return sendHTTPResponse.error(response, 'Issue not found', null, 404)
    }

    const activeAgentAssignment = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveAgentAssignment(CONSTANTS.BUILDING_DATABASE), [issueID])
    issue.agentOTP = activeAgentAssignment ? activeAgentAssignment.otp_code : null
    issue.isWorkFeedbackCompleted = lastCompletetedWorkOrder?.is_satisfied != CONSTANTS.SATISFACTION_STATUS.PENDING
    issue.img_src = issue.img_src ? issue.img_src.split(',') : null
    issue.reviewed = issue.reviewed === CONSTANTS.REVIEW_STATUS.COMPLETED
    const issuesEventsQuery = isCustomer ? queryBuilder.getIssuesEventForCustomer(CONSTANTS.BUILDING_DATABASE) : queryBuilder.getIssuesEvent(CONSTANTS.BUILDING_DATABASE)

    const issuesEvents = await runQuery(CONSTANTS.BUILDING_DATABASE, issuesEventsQuery, [issueID])
    issue.issuesEvents = issuesEvents

    Log.info(`[${domain} | OrganisationID:${orgID}  issueID:${issueID}] | getSingleIssueUnderResidentController | Issue fetched successfully`)
    return sendHTTPResponse.success(response, 'Issue fetched successfully', issue)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}  issueID:${issueID}] | getSingleIssueUnderResidentController | Error in fetching issue | Error: ${error.message}`)
    return sendHTTPResponse.error(response, error.message, null, 400)
  }
}
exports.addIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const userType = request.userType
  try {
    const { projectID, residentID, apartmentID, serviceID, subServiceID } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID} | UserID:${request.userID}] | addIssueController | Data: ${JSON.stringify(request.body)}`)

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
        const savedFilePath = await Fn.saveFileToDisk(file, destination)
        request.body.imgSrcPaths.push(savedFilePath)
      }
    }

    const timeSlot = parseInt(request.body.timeSlot) || 0;

    const issueData = {
      org_id: orgID,
      apartment_id: apartmentID,
      resident_id: residentID,
      description: request.body.description ?? null,
      agent_id: null,
      creator_id: request.userID,
      creator_type: userType === CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      service_type: serviceID,
      service_subtype: subServiceID,
      issue_type: '',
      status: CONSTANTS.ISSUE_STATUS.OPEN,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.OPEN,
      initial_activity_time: _.isEmpty(request.body.scheduledTime) ? null : moment(convertToUTC(request.body.scheduledTime, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss'),
      customer_preferred_time: _.isEmpty(request.body.scheduledTime) ? null : moment(convertToUTC(request.body.scheduledTime, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss'),
      time_slot: timeSlot,
      img_src: _.isEmpty(request.body.imgSrcPaths) ? null : (request.body.imgSrcPaths)?.join(','),
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addIssue(CONSTANTS.BUILDING_DATABASE), [issueData]))?.insertId
    const issueLogData = {
      issue_id: insertID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.OPEN,
      time_slot: timeSlot,
      event_time: _.isEmpty(request.body.scheduledTime) ? moment().utc().format('YYYY-MM-DD HH:mm:ss') : moment(convertToUTC(request.body.scheduledTime, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.OPEN,
      description: '',
      creator_id: request.userID,
      creator_type: request.userType === CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN ? CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN : CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData])
    Log.info(`[${domain} | OrganisationID:${orgID}] | addIssueController | Service request has been raised successfully | IssueID: ${insertID}`)
    return sendHTTPResponse.success(response, 'Service request has been raised successfully', insertID)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while raising service request', error)
  }
}


exports.scheduleVisitIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { agentID, notes, scheduleTime, timeSlot } = request.body

    const notAllowedSubStatusForWorkOrder = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForWorkOrder.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't schedule visit for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`, null, 400)

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED,
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const agentAssignmentData = {
      issue_id: issueID,
      agent_id: agentID,
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.PENDING,
      assigned_by: request.userID,
      visit_scheduled_time: scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null,
      time_slot: timeSlot ? parseInt(timeSlot) : 0,
      otp_sent_time: null,
      otp_code: generateOTP(),
      notes,
      type: CONSTANTS.AGENT_ASSIGNMENT_TYPE.SITE_VISIT,
      created_by: request.userID
    }
    const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentAssignment(CONSTANTS.BUILDING_DATABASE), [agentAssignmentData, issueID]))?.insertId

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.SITE_VISIT_ASSIGNED,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED,
      entity_id: entityID,
      event_time: scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      time_slot: timeSlot ? parseInt(timeSlot) : 0,
      description: notes,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    const residentFCMToken = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentFCMTokenByResidentID(CONSTANTS.BUILDING_DATABASE), [issueDetails[0].resident_id]))?.fcmToken
    const agent = await runQueryOne(CONSTANTS.BUILDING_DATABASE, getAgentDetailsByID(CONSTANTS.BUILDING_DATABASE), [agentID])
    blastPushNotification(residentFCMToken, 'Site Visit Assigned', `A site visit has been scheduled for your request on ${scheduleTime ? momentTZ.utc(scheduleTime).tz('Asia/Kolkata').format('DD MMMM YYYY') : momentTZ().tz('Asia/Kolkata').format('DD MMMM YYYY')} with Agent ${agent?.firstname} ${agent?.lastname}.`)
    Log.info(`[${domain} | OrganisationID:${orgID}] | scheduleVisitIssueController | Issue visit scheduled successfully | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Issue visit scheduled successfully', { entityID, logID })
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
    const timeSlot = parseInt(request.body.timeSlot) || 0;

    const notAllowedSubStatusForWorkOrder = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForWorkOrder.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't add a work order for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED,
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const agentAssignmentData = {
      issue_id: issueID,
      agent_id: agentID,
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.PENDING,
      assigned_by: request.userID,
      visit_scheduled_time: scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null,
      time_slot: timeSlot,
      otp_sent_time: null,
      otp_code: generateOTP(),
      notes,
      type: CONSTANTS.AGENT_ASSIGNMENT_TYPE.WORK_ORDER,
      created_by: request.userID
    }
    const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentAssignment(CONSTANTS.BUILDING_DATABASE), [agentAssignmentData, issueID]))?.insertId

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.WORK_ASSIGNED,
      event_time: scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      time_slot: timeSlot,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED,
      entity_id: entityID,
      description: notes,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | workOrderIssueController | Work order has been successfully scheduled | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Work order has been successfully scheduled', { entityID, logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | workOrderIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding work order', error.message)
  }
}


exports.reAssignWorkOrderController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const agentID = request.body.agentID
  const modifiedVisit = request.body.modifiedVisit
  const modifiedNote = request.body.modifiedNote
  const modifiedDate = request.body.modifiedDate
  const timeSlot = request.body.timeSlot
  try {
    const activeWorkOrder = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeWorkOrder)) return sendHTTPResponse.error(response, 'No active work order found for this issue')

    const currentIssueEvent = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueEventByIssueIdAndEntityId(CONSTANTS.BUILDING_DATABASE), [issueID, activeWorkOrder.id, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED])

    let infoJSON = {
      agent_ids: [activeWorkOrder.agent_id]
    }

    if (currentIssueEvent && currentIssueEvent.info) {
      const existingInfo = JSON.parse(currentIssueEvent.info)
      const lastAgentId = existingInfo.agent_ids[existingInfo.agent_ids.length - 1]
      if (lastAgentId !== activeWorkOrder.agent_id && agentID !== activeWorkOrder.agent_id) {
        infoJSON.agent_ids = [...existingInfo.agent_ids, activeWorkOrder.agent_id]
      } else {
        infoJSON.agent_ids = [...existingInfo.agent_ids]
      }
    }

    if (currentIssueEvent)
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueEventById(CONSTANTS.BUILDING_DATABASE), [{ info: JSON.stringify(infoJSON) }, currentIssueEvent.id])

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED
    }

    const newAgentAssignmentData = {
      agent_id: agentID,
      otp_code: generateOTP(),
      notes: modifiedNote ?? null
    }
    if (modifiedVisit) {
      // newIssueData.customer_preferred_time = null
      newAgentAssignmentData.visit_scheduled_time = modifiedDate ? moment(convertToUTC(modifiedDate, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.time_slot = timeSlot
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueEvent(CONSTANTS.BUILDING_DATABASE), [{ event_time: modifiedDate ? moment(convertToUTC(modifiedDate, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss') : null,time_slot:timeSlot }, issueID])
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentIDInAgentAssignmentofActiveIssue(CONSTANTS.BUILDING_DATABASE), [newAgentAssignmentData, issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | reAssignWorkOrderController | The work order has been re-assigned successfully | IssueID: ${issueID} to AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'The work order has been re-assigned successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | reAssignWorkOrderController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while re-assigning work order', error.message)
  }
}

exports.getSiteVisitUnderIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const details = request.query.details == 'true'
  try {
    const query = details ? queryBuilder.getSiteVisitUnderIssueWithDetails(CONSTANTS.BUILDING_DATABASE) : queryBuilder.getSiteVisitUnderIssue(CONSTANTS.BUILDING_DATABASE)
    const siteVisit = await runQuery(CONSTANTS.BUILDING_DATABASE, query, [issueID])
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

exports.closeIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const hasPendingInvoice = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.hasPendingInvoice(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (!_.isEmpty(hasPendingInvoice)) return sendHTTPResponse.error(response, 'Invoice is pending for this issue')

    await Fn.closeIssueQueries(issueID)
    // adding log for closing issue
    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.CLOSED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED,
      creator_id: request.userID,
      creator_type: request.userType === CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN ? CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN : CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | closeIssueController | Service request has been closed | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Service request has been closed')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | closeIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while closing issue', error.message)
  }
}

exports.reAssignSiteVisitController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const agentID = request.body.agentID
  const modifiedVisit = request.body.modifiedVisit
  const modifiedNote = request.body.modifiedNote
  const modifiedDate = request.body.modifiedDate
  const timeSlot = request.body.timeSlot
  try {

    // there should be an active site visit to re-assign
    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'No active site visit found for this issue')

    const currentIssueEvent = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueEventByIssueIdAndEntityId(CONSTANTS.BUILDING_DATABASE), [issueID, activeSiteVisit.id, CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED])

    let infoJSON = {
      agent_ids: [activeSiteVisit.agent_id]
    }

    if (currentIssueEvent && currentIssueEvent.info) {
      const existingInfo = JSON.parse(currentIssueEvent.info)
      const lastAgentId = existingInfo.agent_ids[existingInfo.agent_ids.length - 1]
      if (lastAgentId !== activeSiteVisit.agent_id && agentID !== activeSiteVisit.agent_id) {
        infoJSON.agent_ids = [...existingInfo.agent_ids, activeSiteVisit.agent_id]
      } else {
        infoJSON.agent_ids = [...existingInfo.agent_ids]
      }
    }

    if (currentIssueEvent)
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueEventById(CONSTANTS.BUILDING_DATABASE), [{ info: JSON.stringify(infoJSON) }, currentIssueEvent.id])

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED,
      updated_by: request.userID
    }

    const newAgentAssignmentData = {
      agent_id: agentID,
      otp_code: generateOTP(),
      notes: modifiedNote
    }
    // sent notification to the agent regarding the issue
    if (modifiedVisit) {
      // newIssueData.customer_preferred_time = null
      const scheduleTime = modifiedDate ? moment(convertToUTC(modifiedDate, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss') : null
      // newIssueData.customer_preferred_time = modifiedDate ? moment(convertToUTC(modifiedDate, CONSTANTS.TIMEZONE)).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.visit_scheduled_time = scheduleTime
      newAgentAssignmentData.time_slot = timeSlot
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueEvent(CONSTANTS.BUILDING_DATABASE), [{ event_time: scheduleTime,time_slot:timeSlot }, issueID])
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentIDInAgentAssignmentofActiveIssue(CONSTANTS.BUILDING_DATABASE), [newAgentAssignmentData, issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | reAssignSiteVisitController | Site visit has been re-assigned successfully | IssueID: ${issueID} to AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'Site visit has been re-assigned successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | reAssignSiteVisitController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while re-assigning issue', error.message)
  }
}

exports.cancelSiteVisitController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {

    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'There is no active site visit for this issue', null, 400)

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED,
      customer_preferred_time: null,
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const activeSiteVisitID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.CANCELLED,
      otp_code: null,
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [updatedAgentAssignmentData, activeSiteVisitID])

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.SITE_VISIT_CANCELLED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED,
      entity_id: activeSiteVisitID,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    // await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.cancelSiteVisit(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | cancelSiteVisitController | Site visit has been cancelled | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Site visit has been cancelled')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | cancelSiteVisitController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while canceling issue site visit', error.message)
  }
}

exports.completeSiteVisitController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { OTP, agentInference } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID}] | completeSiteVisitController | body: ${JSON.stringify(request.body)}`)

    if (_.isEmpty(OTP)) {
      return sendHTTPResponse.error(response, 'OTP is required', null, 400)
    }

    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'There is no active site visit for this issue', null, 400)
    const generatedOTP = activeSiteVisit.otp_code

    if (OTP != generatedOTP) return sendHTTPResponse.error(response, 'Invalid OTP', null, 400)

    if (request.files && request.files.length > 0) {
      const destination = 'uploads/agent-uploads/'
      request.body.imgSrcPaths = []
      for (const file of request.files) {
        const savedFilePath = await Fn.saveFileToDisk(file, destination)
        request.body.imgSrcPaths.push(savedFilePath)
      }
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED,
      updated_by: request.userID,
      customer_preferred_time: null
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const activeSiteVisitID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.COMPLETED,
      agent_inferences: agentInference ?? null,
      agent_uploads: _.isEmpty(request.body.imgSrcPaths) ? null : request.body.imgSrcPaths?.join(', '),
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [updatedAgentAssignmentData, activeSiteVisitID])

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.SITE_VISIT_COMPLETED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_COMPLETED,
      entity_id: activeSiteVisitID,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.AGENT ? CONSTANTS.SERVV_USER_TYPE_NUM.AGENT : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | completeSiteVisitController | Issue site visit completed successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue site visit completed successfully', { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | completeSiteVisitController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while completing issue site visit', error.message)
  }
}

exports.getEstimatesController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimates(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getEstimatesController | Estimates fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Estimate fetched successfully', estimate)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getEstimatesController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching estimates', error.message)
  }
}
exports.addAndSendEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { materialCharge, is18PercentGSTApplied, isInclusiveTax, isExlusiveTax, expiryDate, notes, labourCharge, totalCharge } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID} | userID:${request.userID}] | addAndSendEstimateController | Data: ${JSON.stringify(request.body)}`)

    const isDraft = request.body.isDraft == 'true' ? true : false
    if (_.isEmpty(materialCharge)) {
      return sendHTTPResponse.error(response, 'materialCharge is required', null, 400)
    }
    if (_.isEmpty(labourCharge)) {
      return sendHTTPResponse.error(response, 'labourCharge is required', null, 400)
    }

    if (_.isEmpty(is18PercentGSTApplied)) {
      return sendHTTPResponse.error(response, 'is18PercentGSTApplied is required', null, 400)
    }

    if (_.isEmpty(isInclusiveTax)) {
      return sendHTTPResponse.error(response, 'isInclusiveTax is required', null, 400)
    }

    if (_.isEmpty(isExlusiveTax)) {
      return sendHTTPResponse.error(response, 'isExlusiveTax is required', null, 400)
    }

    if (_.isEmpty(expiryDate)) {
      return sendHTTPResponse.error(response, 'expiryDate is required', null, 400)
    }
    if (_.isEmpty(totalCharge)) {
      return sendHTTPResponse.error(response, 'Total amount is required', null, 400)
    }
    const estimateDetails = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (!_.isEmpty(estimateDetails) && estimateDetails.status != CONSTANTS.QUOTATION_STATUS.DRAFTED) return sendHTTPResponse.error(response, 'Estimate already generated for this issue', null, 400)

    const notAllowedSubStatusForSendEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't send estimate for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)

    if (request.file) {
      const destination = 'uploads/estimates/'
      const savedFilePath = await Fn.saveFileToDisk(request.file, destination)
      request.body.fileName = request.file.originalname
      request.body.estimateSRC = savedFilePath
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT
    }

    const estimateData = {
      material_charge: materialCharge,
      issue_id: issueID,
      total_charge: totalCharge,
      labour_charge: labourCharge,
      is_18_percent_gst_applied: is18PercentGSTApplied == 'true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      is_exclusive_tax: isExlusiveTax == 'true' ? 1 : 0,
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      src: request.body.estimateSRC,
      fileName: request.body.fileName ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND,
      created_by: request.userID
    }

    const infoJSON = {
      amount: totalCharge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const issueLogData = {
      issue_id: issueID,
      event_type: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_SENT,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
      description: notes,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])
    if (_.isEmpty(estimateDetails)) {
      const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addEstimate(CONSTANTS.BUILDING_DATABASE), [estimateData, issueID]))?.insertId
      issueLogData.entity_id = entityID
    }
    else { // already existing estimate will be in drafted status
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [{ status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND }, estimateDetails.id])
      issueLogData.entity_id = estimateDetails.id
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    if (!isDraft) {
      const issueDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
      const residentFCMToken = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentFCMTokenByResidentID(CONSTANTS.BUILDING_DATABASE), [issueDetails.resident_id]))?.fcmToken
      Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSendEstimateController | ResidentFCMToken: ${residentFCMToken} | IssueID: ${issueID} | Notification sent successfully`)
      blastPushNotification(residentFCMToken, 'Estimate Generated', `An estimate has been generated for your service request.`)
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSendEstimateController | The Estimate has been ${isDraft ? "drafted" : "sent"} successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, `The Estimate has been ${isDraft ? "drafted" : "sent"} successfully`, { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addAndSendEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding estimate', error.message)
  }
}

exports.approveEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const notAllowedSubStatusForApproveEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForApproveEstimate.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't approve estimae for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    const estimateData = {
      status: CONSTANTS.QUOTATION_STATUS.APPROVED,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [estimateData, estimate.id])
    const newIssueData = {
      customer_preferred_time: null,
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const infoJSON = {
      amount: estimate.total_charge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: estimate.id,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_APPROVED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | approveEstimateController | The estimate has been approved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'The estimate has been approved successfully', { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | approveEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while approving estimate', error.message)
  }
}
exports.sendEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const notAllowedSubStatusForSendEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't send estimate for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    const estimateData = {
      status: CONSTANTS.QUOTATION_STATUS.SEND
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [estimateData, estimate.id])
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const infoJSON = {
      amount: estimate.total_charge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: estimate.id,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_SENT,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | sendEstimateController | The estimate has been sent successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'The estimate has been sent successfully', { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | sendEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while sending estimate', error.message)
  }
}
exports.editEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { materialCharge, is18PercentGSTApplied, isInclusiveTax, isExlusiveTax, expiryDate, notes, labourCharge, totalCharge } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID} | userID:${request.userID}] | editEstimateController | Data: ${JSON.stringify(request.body)}`)
    const hasFileChanged = request.body.hasFileChanged == 'true' ? true : false
    const isDraft = request.body.isDraft == 'true' ? true : false

    if (_.isEmpty(materialCharge)) {
      return sendHTTPResponse.error(response, 'materialCharge is required', null, 400)
    }
    if (_.isEmpty(labourCharge)) {
      return sendHTTPResponse.error(response, 'labourCharge is required', null, 400)
    }

    if (_.isEmpty(is18PercentGSTApplied)) {
      return sendHTTPResponse.error(response, 'is18PercentGSTApplied is required', null, 400)
    }

    if (_.isEmpty(isInclusiveTax)) {
      return sendHTTPResponse.error(response, 'isInclusiveTax is required', null, 400)
    }

    if (_.isEmpty(isExlusiveTax)) {
      return sendHTTPResponse.error(response, 'isExlusiveTax is required', null, 400)
    }

    if (_.isEmpty(expiryDate)) {
      return sendHTTPResponse.error(response, 'expiryDate is required', null, 400)
    }
    if (_.isEmpty(totalCharge)) {
      return sendHTTPResponse.error(response, 'Total amount is required', null, 400)
    }

    const notAllowedSubStatusForSendEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't edit estimate for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)

    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    if (request.file && hasFileChanged) {
      const destination = 'uploads/estimates/'
      if (estimate.src)
        await Fn.deleteFileFromDisk(estimate.src)
      const savedFilePath = await Fn.saveFileToDisk(request.file, destination)
      request.body.estimateSRC = savedFilePath
      request.body.fileName = request.file.originalname
    }

    const estimateData = {
      material_charge: materialCharge,
      issue_id: issueID,
      total_charge: totalCharge,
      labour_charge: labourCharge,
      is_18_percent_gst_applied: is18PercentGSTApplied == 'true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      is_exclusive_tax: isExlusiveTax == 'true' ? 1 : 0,
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND,
      updated_by: request.userID
    }
    if (hasFileChanged) {
      estimateData.src = request.body.estimateSRC ?? null
      estimateData.fileName = request.body.fileName ?? null
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [estimateData, estimate.id])

    const infoJSON = {
      amount: totalCharge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: estimate.id,
      event_type: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_SENT,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | editEstimateController | The estimate has been ${isDraft ? 'drafted' : 'sent'} successfully | estimateID: ${estimate.id}`)
    return sendHTTPResponse.success(response, `The estimate has been ${isDraft ? 'drafted' : 'sent'} successfully`)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | editEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while updating estimate', error.message)
  }
}

exports.rejectEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const rejectReason = request.body.rejectReason ?? null

    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    const notAllowedSubStatusForRejectEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForRejectEstimate.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't reject estimate for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)

    const estimateData = {
      status: CONSTANTS.QUOTATION_STATUS.REJECTED,
      reject_reason: rejectReason,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [estimateData, estimate.id])

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED,
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const infoJSON = {
      amount: estimate.total_charge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: estimate.id,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_REJECTED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | rejectEstimateController | The estimate has been rejected | estimateID: ${estimate.id} | logID: ${logID}`)
    return sendHTTPResponse.success(response, 'The estimate has been rejected')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | rejectEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while rejecting estimate', error.message)
  }
}

exports.deleteEstimateController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.deleteEstimate(CONSTANTS.BUILDING_DATABASE), [estimate.id])

    Log.info(`[${domain} | OrganisationID:${orgID}] | deleteEstimateController | The estimate has been deleted | estimateID: ${estimate.id}`)
    return sendHTTPResponse.success(response, 'The estimate has been deleted')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | deleteEstimateController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while deleting estimate', error.message)
  }
}


exports.getInvoiceController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoice(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getInvoiceController | Invoice fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Invoice fetched successfully', estimate)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getInvoiceController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching invoice', error.message)
  }
}

exports.addAndSentInvoiceController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { materialCharge, is18PercentGSTApplied, isInclusiveTax, expiryDate, notes, labourCharge, totalCharge } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID} | userID:${request.userID}] | addAndSentInvoiceController | Data: ${JSON.stringify(request.body)}`)

    const isDraft = request.body.isDraft == 'true' ? true : false
    if (_.isEmpty(materialCharge)) {
      return sendHTTPResponse.error(response, 'materialCharge is required', null, 400)
    }
    if (_.isEmpty(labourCharge)) {
      return sendHTTPResponse.error(response, 'labourCharge is required', null, 400)
    }

    if (_.isEmpty(is18PercentGSTApplied)) {
      return sendHTTPResponse.error(response, 'is18PercentGSTApplied is required', null, 400)
    }

    if (_.isEmpty(isInclusiveTax)) {
      return sendHTTPResponse.error(response, 'isInclusiveTax is required', null, 400)
    }

    if (_.isEmpty(totalCharge)) {
      return sendHTTPResponse.error(response, 'Total amount is required', null, 400)
    }

    const exsitingInvoiceDetails = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (!_.isEmpty(exsitingInvoiceDetails) && exsitingInvoiceDetails.status != CONSTANTS.QUOTATION_STATUS.DRAFTED) return sendHTTPResponse.error(response, 'Invoice already generated for this issue', null, 400)

    const notAllowedSubStatusToAddInvoice = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusToAddInvoice.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't ${isDraft ? 'add draft ' : 'sent'} invoice for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`, null, 400)

    if (request.file) {
      const destination = 'uploads/invoices/'
      const savedFilePath = await Fn.saveFileToDisk(request.file, destination)
      request.body.invoiceSRC = savedFilePath
      request.body.fileName = request.file.originalname
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT
    }

    const invoiceData = {
      material_charge: materialCharge,
      issue_id: issueID,
      total_charge: totalCharge,
      labour_charge: labourCharge,
      is_18_percent_gst_applied: is18PercentGSTApplied == 'true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      src: request.body.invoiceSRC,
      fileName: request.body.fileName ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const infoJSON = {
      amount: totalCharge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const issueLogData = {
      issue_id: issueID,
      event_type: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_SENT,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT,
      description: notes,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }

    if (_.isEmpty(exsitingInvoiceDetails)) {
      const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addInvoice(CONSTANTS.BUILDING_DATABASE), [invoiceData, issueID]))?.insertId
      issueLogData.entity_id = entityID
    }
    else {
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [{ status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND }, exsitingInvoiceDetails.id])
      issueLogData.entity_id = exsitingInvoiceDetails.id
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    if (!isDraft) {
      const issueDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
      const residentFCMToken = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentFCMTokenByResidentID(CONSTANTS.BUILDING_DATABASE), [issueDetails.resident_id]))?.fcmToken
      Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSentInvoiceController | ResidentFCMToken: ${residentFCMToken} | IssueID: ${issueID} | Notification sent successfully`)
      blastPushNotification(residentFCMToken, 'Invoice Generated', `An invoice has been generated for your service request.`)
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSentInvoiceController | The invoice has been ${isDraft ? 'drafted' : 'sent'} successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, `The invoice has been ${isDraft ? 'drafted' : 'sent'} successfully`, { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addAndSentInvoiceController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding invoice', error.message)
  }
}

exports.editInvoiceController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { materialCharge, is18PercentGSTApplied, isInclusiveTax, expiryDate, notes, labourCharge, totalCharge } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID} | userID:${request.userID}] | editInvoiceController | Data: ${JSON.stringify(request.body)}`)

    const hasFileChanged = request.body.hasFileChanged == 'true' ? true : false
    const isDraft = request.body.isDraft == 'true' ? true : false

    if (_.isEmpty(materialCharge)) {
      return sendHTTPResponse.error(response, 'materialCharge is required', null, 400)
    }
    if (_.isEmpty(labourCharge)) {
      return sendHTTPResponse.error(response, 'labourCharge is required', null, 400)
    }

    if (_.isEmpty(is18PercentGSTApplied)) {
      return sendHTTPResponse.error(response, 'is18PercentGSTApplied is required', null, 400)
    }

    if (_.isEmpty(isInclusiveTax)) {
      return sendHTTPResponse.error(response, 'isInclusiveTax is required', null, 400)
    }

    if (_.isEmpty(totalCharge)) {
      return sendHTTPResponse.error(response, 'Total amount is required', null, 400)
    }


    const notAllowedSubStatusForEditInvoice = [CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForEditInvoice.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, 'You can\'t edit invoice for this issue as the issue is already in ' + getSubStatusStringById(issueDetails[0]?.sub_status))

    const invoiceData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(invoiceData))
      return sendHTTPResponse.error(response, 'No active invoice found for this issue', null, 400)

    if (request.file && hasFileChanged) {
      const destination = 'uploads/invoices/'
      if (invoiceData.src)
        await Fn.deleteFileFromDisk(invoiceData.src)
      const savedFilePath = await Fn.saveFileToDisk(request.file, destination)
      request.body.invoiceSRC = savedFilePath
      request.body.fileName = request.file.originalname
    }

    const invoiceDBData = {
      material_charge: materialCharge,
      issue_id: issueID,
      total_charge: totalCharge,
      labour_charge: labourCharge,
      is_18_percent_gst_applied: is18PercentGSTApplied == 'true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND,
      updated_by: request.userID
    }
    if (hasFileChanged) {
      invoiceDBData.src = request.body.invoiceSRC ?? null
      invoiceDBData.fileName = request.body.fileName ?? null
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT,
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [invoiceDBData, invoiceData.id])

    const infoJSON = {
      amount: invoiceData.total_charge,
      approved_rejected_by: invoiceData.approved_rejected_by || null,
      approved_rejected_by_type: invoiceData.approved_rejected_by_type || null
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: invoiceData.id,
      event_type: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_SENT,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | editInvoiceController | The invoice has been updated successfully | invoiceID: ${invoiceData.id}`)
    return sendHTTPResponse.success(response, 'The invoice has been updated successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | editInvoiceController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while updating invoice', error.message)
  }
}

exports.approveInvoiceController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const notAllowedSubStatusForApproveInvoice = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (notAllowedSubStatusForApproveInvoice.includes(issueDetails[0]?.sub_status) || issueDetails[0]?.status == CONSTANTS.ISSUE_STATUS.CLOSED) return sendHTTPResponse.error(response, `You can't approve invoice for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)
    const invoice = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(invoice)) return sendHTTPResponse.error(response, 'No active invoice found for this issue', null, 400)

    const invoiceData = {
      status: CONSTANTS.QUOTATION_STATUS.APPROVED,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [invoiceData, invoice.id])
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const infoJSON = {
      amount: invoice.total_charge,
      approved_rejected_by: request.userID,
      approved_rejected_by_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const issueLogData = {
      issue_id: issueID,
      entity_id: invoice.id,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_APPROVED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN,
      info: JSON.stringify(infoJSON)
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | approveInvoiceController | The invoice has been approved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'The invoice has been approved successfully', { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | approveInvoiceController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while approving invoice', error.message)
  }
}

exports.recordPaymentController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { amount, paymentMode, notes, collectedBy } = request.body
    const paymentDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if (_.isEmpty(paymentDetails)) return sendHTTPResponse.error(response, 'No invoice found for this issue', null, 400)

    const totalCharge = paymentDetails.total_charge
    if (amount > totalCharge) return sendHTTPResponse.error(response, 'Amount is greater than total charge', null, 400)
    if (amount < totalCharge) return sendHTTPResponse.error(response, 'Partial Payment is not allowed', null, 400)

    const updateInvoiceDetails = {
      status: CONSTANTS.QUOTATION_STATUS.PAID,
      collected_by: collectedBy,
      notes,
      payment_mode: paymentMode,
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.CLOSED,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [updateInvoiceDetails, paymentDetails.id])

    const issueLogData = {
      issue_id: issueID,
      entity_id: paymentDetails.id,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.PAID,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | recordPaymentController | The payment has been recorded successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'The payment has been recorded successfully', { logID })
  }
  catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | recordPaymentController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while recording payment', error.message)
  }
}

exports.addPreferredTimeController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { preferredDate, timeSlot, isSkipped } = request.body
    const newIssueData = {
      customer_preferred_time: isSkipped ? null : moment.utc(preferredDate)?.format('YYYY-MM-DD'),
      time_slot: timeSlot || 0
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | addPreferredTimeController | The preferred time has been added successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'The preferred time has been added successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addPreferredTimeController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding preferred time', error.message)
  }
}


exports.getIssueHistoryController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const isCustomer = request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER
  try {
    const query = isCustomer ? queryBuilder.getIssueHistoryForCustomer(CONSTANTS.BUILDING_DATABASE) : queryBuilder.getIssueHistory(CONSTANTS.BUILDING_DATABASE)
    const issueHistory = await runQuery(CONSTANTS.BUILDING_DATABASE, query, [issueID])
    const customerIssueHistory = isCustomer && issueHistory?.filter(issue => issue.event_type != null)
    Log.info(`[${domain} | OrganisationID:${orgID}] | getIssueHistoryController | Issue history fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue history fetched successfully', isCustomer ? customerIssueHistory : issueHistory)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getIssueHistoryController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching issue history', error.message)
  }
}

exports.holdIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.ONHOLD,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ONHOLD
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.ONHOLD,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ONHOLD,
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | holdIssueController | Service request has been put on hold | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Service request has been put on hold')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | holdIssueController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while holding issue', error.message)
  }
}

exports.cancelWorkOrderController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_CANCELLED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])
    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))

    if (_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'There is no active work order for this issue', null, 400)

    const activeWorkOrderID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.CANCELLED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [updatedAgentAssignmentData, activeWorkOrderID])

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.WORK_CANCELLED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_CANCELLED,
      entity_id: activeWorkOrderID, //since it have multiple workorders
      creator_id: request.userID,
      creator_type: CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | cancelWorkOrderController | The work order has been cancelled | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'The work order has been cancelled')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | cancelWorkOrderController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while canceling Work order', error.message)
  }
}

exports.completeWorkOrderController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const { OTP, agentInference } = request.body
    Log.info(`[${domain} | OrganisationID:${orgID}] | completeWorkOrderController | body: ${JSON.stringify(request.body)}`)

    if (_.isEmpty(OTP)) {
      return sendHTTPResponse.error(response, 'OTP is required', null, 400)
    }

    const activeWorkOrder = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeWorkOrder)) return sendHTTPResponse.error(response, 'There is no active work order for this issue', null, 400)
    const generatedOTP = activeWorkOrder.otp_code

    if (OTP != generatedOTP) return sendHTTPResponse.error(response, 'Invalid OTP', null, 400)

    if (request.files && request.files.length > 0) {
      const destination = 'uploads/agent-uploads/'
      request.body.imgSrcPaths = []
      for (const file of request.files) {
        const savedFilePath = await Fn.saveFileToDisk(file, destination)
        request.body.imgSrcPaths.push(savedFilePath)
      }
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_COMPLETED,
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [newIssueData, issueID])

    const activeWorkOrderID = activeWorkOrder.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.COMPLETED,
      agent_inferences: agentInference ?? null,
      agent_uploads: _.isEmpty(request.body.imgSrcPaths) ? null : request.body.imgSrcPaths?.join(', '),
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [updatedAgentAssignmentData, activeWorkOrderID])

    const issueLogData = {
      issue_id: issueID,
      event_type: CONSTANTS.ISSUE_SUB_STATUS_STRING.WORK_COMPLETED,
      event_time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_COMPLETED,
      entity_id: activeWorkOrderID,
      creator_id: request.userID,
      creator_type: request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.AGENT ? CONSTANTS.SERVV_USER_TYPE_NUM.AGENT : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | completeWorkOrderController | Issue work completed successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue work completed successfully', { logID })
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | completeWorkOrderController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while completing issue work', error.message)
  }
}

exports.worOrderFeedbackController = async (request, response) => {
  const issueID = request.params.issueID

  try {
    const { satisfied, description } = request.body
    const activeWorkOrder = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getCompletedWorkOrderByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if (_.isEmpty(activeWorkOrder)) return sendHTTPResponse.error(response, 'There is no active work order for this issue', null, 400)

    const satisfactionValue = satisfied ? CONSTANTS.SATISFACTION_STATUS.SATISFIED : CONSTANTS.SATISFACTION_STATUS.UNSATISFIED

    const activeWorkOrderID = activeWorkOrder.id
    const updatedAgentAssignmentData = {
      is_satisfied: satisfactionValue,
      feedback_comments: description ?? null,
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [updatedAgentAssignmentData, activeWorkOrderID])

    Log.info(`[worOrderFeedbackController | Workorder feedback saved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Workorder feedback submitted successfully')
  } catch (error) {
    Log.error(`[worOrderFeedbackController | IssueID: ${issueID}] | ${error.message}`)
    return sendHTTPResponse.error(response, 'Error while submitting workorder feedback', error.message, 500)
  }

}
exports.issueFeedbackController = async (request, response) => {
  const issueID = request.params.issueID

  try {
    const { starRating } = request.body
    const issueDetails = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID]))

    // const completedIssue = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getCompletedIssueByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    // if (_.isEmpty(completedIssue)) return sendHTTPResponse.error(response, 'Issue is not completed yet!', null, 400)


    const completedIssueId = issueDetails.id
    const updatedIssueData = {
      rating: starRating,
      reviewed: CONSTANTS.REVIEW_STATUS.COMPLETED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [updatedIssueData, completedIssueId])

    Log.info(`[issueFeedbackController | Issue feedback saved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue Feedback submitted successfully')
  } catch (error) {
    Log.error(`[issueFeedbackController | IssueID: ${issueID}] | ${error.message}`)
    return sendHTTPResponse.error(response, 'Error while submitting issue feedback', error.message, 500)
  }

}