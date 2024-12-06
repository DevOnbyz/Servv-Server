const fs = require('fs')
const path = require('path')
const runQuery = require('../../../db/runQuery')
const queryBuilder = require('./query')
const moment = require('moment')
const runQueryOne = require('../../../db/runQueryOne')
const CONSTANTS = require('../../../lib/constants')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const Log = require('../../../log')
const Fn = require('./function')


const startIssueReportGeneration = async (orgName, orgID) => {
  try {
    const unCreatedIssueReport = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getUncreatedIssueReport(CONSTANTS.BUILDING_DATABASE), [orgID])
    if (_.isEmpty(unCreatedIssueReport)) return

    const currentReportID = unCreatedIssueReport.id
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueReport(CONSTANTS.BUILDING_DATABASE), [{status: CONSTANTS.REPORT_STATUS.INPROGRESS}, currentReportID])

    Log.info(`[${orgName}] | startIssueReportGeneration | Issue report generation started for ${orgName} (ID: ${orgID}) | ReportID: ${currentReportID}`)

    const config = unCreatedIssueReport.config ? JSON.parse(unCreatedIssueReport.config) : {}
    const startDate = unCreatedIssueReport.start_date ? moment(unCreatedIssueReport.start_date, 'YYYY-MM-DD').format('YYYY-MM-DD') : null
    const endDate = unCreatedIssueReport.end_date ? moment(unCreatedIssueReport.end_date, 'YYYY-MM-DD').format('YYYY-MM-DD') : null
    const projectList = config.projectList ? config.projectList : []

    if (_.isEmpty(projectList)) throw new Error('Please select at least one project')
    const appartmentUnderProject = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getApartmentsUnderProject(CONSTANTS.BUILDING_DATABASE), [projectList])

    const apartmentIDList = _.map(appartmentUnderProject, 'id')
    const uniqueID = uuidv4()
    const csvFilePath = path.join(`./public/downloads/issue_report_${orgName}_${uniqueID}.csv`)
    const downloadPath = `download/issue_report_${orgName}_${uniqueID}.csv`
    
    const writeStream = fs.createWriteStream(csvFilePath, { flags: 'a' })

    const issueData = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getIssueReportDetails(CONSTANTS.BUILDING_DATABASE, startDate, endDate), [orgID, apartmentIDList])

    if (_.isEmpty(issueData)) {
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueReport(CONSTANTS.BUILDING_DATABASE), [{status: CONSTANTS.REPORT_STATUS.SKIPPED}, currentReportID])
      return
    }

    await Fn.processDataInChunks(orgName, issueData, writeStream, 0)
    const reportUpdateData = {
      status: CONSTANTS.REPORT_STATUS.COMPLETED,
      download_path: downloadPath,
      filename : `issue_report_${orgName}_${uniqueID}.csv`,
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueReport(CONSTANTS.BUILDING_DATABASE), [reportUpdateData, currentReportID])

    Log.info(`[ ${orgName}] | startIssueReportGeneration | Issue report generation completed for ${orgName} (ID: ${orgID})`)
    writeStream.end()
  } catch (error) {
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssueReport(CONSTANTS.BUILDING_DATABASE), [{status: CONSTANTS.REPORT_STATUS.FAILED}, currentReportID])
    Log.error(`[ ${orgName}] | startIssueReportGeneration | ${error.message}`)
  }
}

module.exports = {
  startIssueReportGeneration,
}
