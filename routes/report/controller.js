const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const Log = require('../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { addIssueEvent, getProjectByIDs } = require('../../db/query')
const { generateOTP, getSubStatusStringById, blastPushNotification } = require('../../lib/function')
const moment = require('moment')
const runQueryOne = require('../../db/runQueryOne')
const Fn = require('./functions')
const { getReportTypeDetails } = require('./functions')

exports.getReportsController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const reports = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getReports(CONSTANTS.BUILDING_DATABASE), [orgID])
    for(const report of reports){
      report.config = JSON.parse(report.config)
      const associatedProjectNames = (await runQuery(CONSTANTS.BUILDING_DATABASE, getProjectByIDs(CONSTANTS.BUILDING_DATABASE), [report.config.projectList]))?.map((project) => (project.name))
      report.config.projectList = associatedProjectNames
    }
    Log.info(`[${domain} | OrganisationID:${orgID}] | getReports | Reports fetched successfully`)
    return sendHTTPResponse.success(response, 'Reports fetched successfully', reports)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getReports | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching reports', error.message)
  }
}
exports.addReportController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const config = request.body.config
    const reportType = getReportTypeDetails(parseInt(config.type))

    if(!reportType)
      return sendHTTPResponse.error(response, 'Invalid report type', null, 400)

    const reportData = {
      name: reportType?.NAME,
      type: config.type,
      status: CONSTANTS.REPORT_STATUS.PENDING,
      start_date: config.startDate ? moment(config.startDate, 'YYYY-MM-DD').format('YYYY-MM-DD') : null,
      end_date: config.endDate ? moment(config.endDate, 'YYYY-MM-DD').format('YYYY-MM-DD') : null,
      org_id: orgID,
      config: JSON.stringify(config)
    }    
    await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.addReport(CONSTANTS.BUILDING_DATABASE), [reportData])
    Log.info(`[${domain} | OrganisationID:${orgID}] | addReport | Report genration request added successfully | ReportType: ${config.type} `)
    return sendHTTPResponse.success(response, 'Report genration request added successfully', 'report')
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addReport | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while adding report', error.message)
  }
}