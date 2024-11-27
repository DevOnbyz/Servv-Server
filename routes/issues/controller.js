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
const { generateOTP, getSubStatusStringById } = require('../../lib/function')
const moment = require('moment')
const runQueryOne = require('../../db/runQueryOne')
const Fn = require('./functions')

exports.getIssuesController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssues(CONSTANTS.BUILDING_DATABASE),[orgID])
    for (const issue of issues) {
      issue.img_src = issue.img_src?.split(',')
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

exports.getIssueStatController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const issueStat = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueStat(CONSTANTS.BUILDING_DATABASE),[orgID])
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
  const itemsPerPage = 3
  const pageNumber = request.query.pageNumber ? parseInt(request.query.pageNumber) : 0
  const offset = (pageNumber - 1) * itemsPerPage
  try {
    const issues = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuesUnderResident(CONSTANTS.BUILDING_DATABASE, itemsPerPage, offset),[residentID, orgID])
    for (const issue of issues) {
      issue.img_src = issue.img_src?.split(',')
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
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.OPEN,
      scheduled_time: _.isEmpty(request.body.scheduledTime) ? null : request.body.scheduledTime,
      img_src: _.isEmpty(request.body.imgSrcPaths) ? null : (request.body.imgSrcPaths)?.join(','),
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addIssue(CONSTANTS.BUILDING_DATABASE), [issueData]))?.insertId
    const issueLogData = {
      issue_id : insertID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.OPEN,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.OPEN,
      description : '',
      creator_id : request.userID,
      creator_type : request.userType === CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN ? CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN : CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER
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

    const notAllowedSubStatusForWorkOrder = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForWorkOrder.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, `You can't schedule visit for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`, null, 400)
    
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED
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
      notes,
      created_by: request.userID
    }
    const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAgentAssignment(CONSTANTS.BUILDING_DATABASE), [ agentAssignmentData, issueID ]))?.insertId

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.SITE_VISIT_ASSIGNED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED,
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
    const notAllowedSubStatusForWorkOrder = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForWorkOrder.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, `You can't add a work order for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED,
      scheduled_time: scheduleTime ? moment(scheduleTime).format('YYYY-MM-DD HH:mm:ss') : null
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


exports.reAssignWorkOrderController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  const agentID = request.body.agentID
  const modifiedVisit = request.body.modifiedVisit
  const modifiedNote = request.body.modifiedNote
  const modifiedDate = request.body.modifiedDate
  try {
    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if(_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'No active work order found for this issue')

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED
    }

    const newAgentAssignmentData = {
      agent_id: agentID,
      otp_code: generateOTP(),
    }
    if(modifiedVisit){
      newIssueData.scheduled_time = modifiedDate ? moment(modifiedDate).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.visit_scheduled_time = modifiedDate ? moment(modifiedDate).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.notes = modifiedNote
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentIDInAgentAssignmentofActiveIssue(CONSTANTS.BUILDING_DATABASE), [ newAgentAssignmentData, issueID ])
    Log.info(`[${domain} | OrganisationID:${orgID}] | reAssignWorkOrderController | Work order re-assigned successfully | IssueID: ${issueID} to AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'Work order re-assigned successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | reAssignWorkOrderController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while re-assigning work order', error.message)
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

exports.closeIssueController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const hasPendingInvoice = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.hasPendingInvoice(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(!_.isEmpty(hasPendingInvoice)) return sendHTTPResponse.error(response, 'Invoice is pending for this issue')
    
    await Fn.closeIssueQueries(issueID)
    // adding log for closing issue
    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.CLOSED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED,
      creator_id : request.userID,
      creator_type : request.userType === CONSTANTS.SERVV_USER_TYPE_STRING.ADMIN ? CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN : CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | closeIssueController | Issue closed successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue closed successfully')
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
  try {

    // there should be an active site visit to re-assign
    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
    if(_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'No active site visit found for this issue')

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      agent_id: agentID,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED,
      updated_by: request.userID
    }

    const newAgentAssignmentData = {
      agent_id: agentID,
      otp_code: generateOTP(),
    }
    // sent notification to the agent regarding the issue
    if(modifiedVisit){
      newIssueData.scheduled_time = modifiedDate ? moment(modifiedDate).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.visit_scheduled_time = modifiedDate ? moment(modifiedDate).format('YYYY-MM-DD HH:mm:ss') : null
      newAgentAssignmentData.notes = modifiedNote
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentIDInAgentAssignmentofActiveIssue(CONSTANTS.BUILDING_DATABASE), [ newAgentAssignmentData, issueID ])
    Log.info(`[${domain} | OrganisationID:${orgID}] | reAssignSiteVisitController | Issue re-assigned successfully | IssueID: ${issueID} to AgentID: ${agentID}`)
    return sendHTTPResponse.success(response, 'Issue re-assigned successfully')
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
    if(_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'There is no active site visit for this issue', null, 400)
    
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED,
      scheduled_time: null,
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])

    const activeSiteVisitID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.CANCELLED,
      otp_code: null,
      updated_by: request.userID
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [ updatedAgentAssignmentData, activeSiteVisitID ])

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.SITE_VISIT_CANCELLED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_CANCELLED,
      entity_id: activeSiteVisitID,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    // await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.cancelSiteVisit(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | cancelSiteVisitController | Issue cancelled successfully | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Issue site visit cancelled successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | cancelSiteVisitController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while canceling issue site visit', error.message)
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
    const {materialCharge, is18PercentGSTApplied, isInclusiveTax, isExlusiveTax, expiryDate, notes, labourCharge, totalCharge} = request.body
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
    if(!_.isEmpty(estimateDetails) && estimateDetails.status!= CONSTANTS.QUOTATION_STATUS.DRAFTED) return sendHTTPResponse.error(response, 'Estimate already generated for this issue', null, 400)

    const notAllowedSubStatusForSendEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT, CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, `You can't send estimate for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)
      
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
      is_18_percent_gst_applied: is18PercentGSTApplied =='true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      is_exclusive_tax: isExlusiveTax == 'true' ? 1 : 0,  
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      src: request.body.estimateSRC,
      fileName: request.body.fileName ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND,
      created_by: request.userID
    }
    const issueLogData = {
      issue_id : issueID,
      event_type : isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_SENT,
      sub_status : isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
      description : notes,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])
    if(_.isEmpty(estimateDetails)){
      const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addEstimate(CONSTANTS.BUILDING_DATABASE), [ estimateData, issueID ]))?.insertId
      issueLogData.entity_id = entityID
    }
    else{ // already existing estimate will be in drafted status
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [ {status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND}, estimateDetails.id ])
      issueLogData.entity_id = estimateDetails.id
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSendEstimateController | Estimate added successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Estimate added successfully', {logID})
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
    const notAllowedSubStatusForApproveEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID, CONSTANTS.ISSUE_SUB_STATUS_NUM.CLOSED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForApproveEstimate.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, `You can't approve estimae for this issue as the issue is already in ${getSubStatusStringById(issueDetails[0]?.sub_status)}`)
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    const estimateData = {
      status: CONSTANTS.QUOTATION_STATUS.APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [ estimateData, estimate.id ])
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_APPROVED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED,
      creator_id : request.userID,
      creator_type : request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | approveEstimateController | Estimate approved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Estimate approved successfully', {logID})
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
    if(notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status to send estimate')
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    const estimateData = {
      status: CONSTANTS.QUOTATION_STATUS.SEND
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [ estimateData, estimate.id ])
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_SENT,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | sendEstimateController | Estimate send successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Estimate sent successfully', {logID})
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
    const {materialCharge, is18PercentGSTApplied, isInclusiveTax, isExlusiveTax, expiryDate, notes, labourCharge, totalCharge} = request.body
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

    const notAllowedSubStatusForSendEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_APPROVED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForSendEstimate.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status to edit estimate')
    
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    if (request.file && hasFileChanged) {
      const destination = 'uploads/estimates/'
      if(estimate.src)
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
      is_18_percent_gst_applied: is18PercentGSTApplied =='true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      is_exclusive_tax: isExlusiveTax == 'true' ? 1 : 0,  
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND,
      updated_by: request.userID
    }
    if(hasFileChanged){
      estimateData.src = request.body.estimateSRC ?? null
      estimateData.fileName = request.body.fileName ?? null
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_DRAFT : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_SENT,
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [ estimateData, estimate.id ])

    Log.info(`[${domain} | OrganisationID:${orgID}] | editEstimateController | Estimate updated successfully | estimateID: ${estimate.id}`)
    return sendHTTPResponse.success(response, 'Estimate updated successfully')
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
    const estimate = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

      const estimateData = {
        status: CONSTANTS.QUOTATION_STATUS.REJECTED
      }
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateEstimate(CONSTANTS.BUILDING_DATABASE), [ estimateData, estimate.id ])

      const newIssueData = {
        status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
        sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED,
      }

      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 
  
      const issueLogData = {
        issue_id : issueID,
        event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.ESTIMATE_REJECTED,
        sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.ESTIMATE_REJECTED,
        creator_id : request.userID,
        creator_type : request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
      }
      const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
      Log.info(`[${domain} | OrganisationID:${orgID}] | rejectEstimateController | Estimate rejected successfully | estimateID: ${estimate.id} | logID: ${logID}`)
      return sendHTTPResponse.success(response, 'Estimate rejected successfully')
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
    if(_.isEmpty(estimate)) return sendHTTPResponse.error(response, 'No active estimate found for this issue', null, 400)

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.deleteEstimate(CONSTANTS.BUILDING_DATABASE), [estimate.id])

    Log.info(`[${domain} | OrganisationID:${orgID}] | deleteEstimateController | Estimate deleted successfully | estimateID: ${estimate.id}`)
    return sendHTTPResponse.success(response, 'Estimate deleted successfully')
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
    const {materialCharge, is18PercentGSTApplied, isInclusiveTax, expiryDate, notes, labourCharge, totalCharge} = request.body
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
    if(!_.isEmpty(exsitingInvoiceDetails) && exsitingInvoiceDetails.status!= CONSTANTS.QUOTATION_STATUS.DRAFTED) return sendHTTPResponse.error(response, 'Invoice already generated for this issue', null, 400)

    const notAllowedSubStatusToAddInvoice = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusToAddInvoice.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status for invoice')
      
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
      is_18_percent_gst_applied: is18PercentGSTApplied =='true' ? 1 : 0,
      is_inclusive_tax: isInclusiveTax == 'true' ? 1 : 0,
      expiry_date: moment(expiryDate, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      notes: notes ?? null,
      src: request.body.invoiceSRC,
      fileName: request.body.fileName ?? null,
      status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])

    const issueLogData = {
      issue_id : issueID,
      event_type : isDraft ? CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_SENT,
      sub_status : isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT,
      description : notes,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    if(_.isEmpty(exsitingInvoiceDetails)){
      const entityID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addInvoice(CONSTANTS.BUILDING_DATABASE), [ invoiceData, issueID ]))?.insertId
      issueLogData.entity_id = entityID
    }
    else{
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [ {status: isDraft ? CONSTANTS.QUOTATION_STATUS.DRAFTED : CONSTANTS.QUOTATION_STATUS.SEND}, estimateDetails.id ])
      issueLogData.entity_id = exsitingInvoiceDetails.id
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId


    Log.info(`[${domain} | OrganisationID:${orgID}] | addAndSentInvoiceController | Invoice ${isDraft ? 'drafted' : 'sent'} successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, `Invoice ${isDraft ? 'drafted' : 'sent'} successfully`, {logID})
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
    const {materialCharge, is18PercentGSTApplied, isInclusiveTax, expiryDate, notes, labourCharge, totalCharge} = request.body
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


    const notAllowedSubStatusForEditInvoice = [CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForEditInvoice.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status to edit invoice')
    
    const invoiceData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(invoiceData)) return sendHTTPResponse.error(response, 'No active invoice found for this issue', null, 400)

    if (request.file && hasFileChanged) {
      const destination = 'uploads/invoices/'
      if(invoiceData.src)
        await Fn.deleteFileFromDisk(invoiceData.src)
      const savedFilePath = await Fn.saveFileToDisk(request.file, destination)
      request.body.estimateSRC = savedFilePath
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
    if(hasFileChanged){
      invoiceDBData.src = request.body.invoiceSRC ?? null
      invoiceDBData.fileName = request.body.fileName ?? null
    }

    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: isDraft ? CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_DRAFTED : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_SENT,
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [ invoiceDBData, invoiceData.id ])

    Log.info(`[${domain} | OrganisationID:${orgID}] | editInvoiceController | Invoice updated successfully | invoiceID: ${invoiceData.id}`)
    return sendHTTPResponse.success(response, 'Invoice updated successfully')
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
    const notAllowedSubStatusForApproveEstimate = [CONSTANTS.ISSUE_SUB_STATUS_NUM.SITE_VISIT_ASSIGNED, CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ASSIGNED]
    const issueDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssuseByID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(notAllowedSubStatusForApproveEstimate.includes(issueDetails[0]?.sub_status)) return sendHTTPResponse.error(response, 'Invalid issue status to approve invoice')
    const invoice = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
    if(_.isEmpty(invoice)) return sendHTTPResponse.error(response, 'No active invoice found for this issue', null, 400)

    const invoiceData = {
      status: CONSTANTS.QUOTATION_STATUS.APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateInvoice(CONSTANTS.BUILDING_DATABASE), [ invoiceData, invoice.id ])
    const newIssueData = {
      status: CONSTANTS.ISSUE_STATUS.INPROGRESS,
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ]) 

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.INVOICE_APPROVED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.INVOICE_APPROVED,
      creator_id : request.userID,
      creator_type : request.userType == CONSTANTS.SERVV_USER_TYPE_STRING.CUSTOMER ? CONSTANTS.SERVV_USER_TYPE_NUM.CUSTOMER : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId

    Log.info(`[${domain} | OrganisationID:${orgID}] | approveInvoiceController | Invoice approved successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Invoice approved successfully', {logID})
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | approveInvoiceController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while approving invoice', error.message)
  }
}

exports.getIssueHistoryController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const issueID = request.params.issueID
  try {
    const issueHistory = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueHistory(CONSTANTS.BUILDING_DATABASE), [issueID])
    Log.info(`[${domain} | OrganisationID:${orgID}] | getIssueHistoryController | Issue history fetched successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue history fetched successfully', issueHistory)
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

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.ONHOLD,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.ONHOLD,
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }
    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | holdIssueController | Issue hold successfully | IssueID: ${issueID}`)
    return sendHTTPResponse.success(response, 'Issue hold successfully')
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
      sub_status: CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ORDER_CANCELLED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [ newIssueData, issueID ])
    const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))

    if(_.isEmpty(activeSiteVisit)) return sendHTTPResponse.error(response, 'There is no active work order for this issue', null, 400)

    const activeWorkOrderID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.CANCELLED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [ updatedAgentAssignmentData, activeWorkOrderID ])

    const issueLogData = {
      issue_id : issueID,
      event_type : CONSTANTS.ISSUE_SUB_STATUS_STRING.WORK_ORDER_CANCELLED,
      sub_status : CONSTANTS.ISSUE_SUB_STATUS_NUM.WORK_ORDER_CANCELLED,
      entity_id: activeWorkOrderID, //since it have multiple workorders
      creator_id : request.userID,
      creator_type : CONSTANTS.SERVV_USER_TYPE_NUM.ADMIN
    }

    const logID = (await runQuery(CONSTANTS.BUILDING_DATABASE, addIssueEvent(CONSTANTS.BUILDING_DATABASE), [issueLogData]))?.insertId
    Log.info(`[${domain} | OrganisationID:${orgID}] | cancelWorkOrderController | Work order cancelled successfully | IssueID: ${issueID} | LogID: ${logID}`)
    return sendHTTPResponse.success(response, 'Work order site visit cancelled successfully')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | cancelWorkOrderController | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while canceling Work order', error.message)
  }
}