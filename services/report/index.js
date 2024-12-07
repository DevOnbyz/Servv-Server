const constants = require("../../lib/constants")
const Log = require("../../log")
const CONSTANTS = require("../../lib/constants")
const { startIssueReportGeneration } = require("./issueReport")
const runQuery = require("../../db/runQuery")
const { getOrganisations, getActiveReports } = require("../../db/query")
const _ = require("lodash")

const startReportingService = async (orgName, orgID) => {
  const activeRunningReport = await runQuery(CONSTANTS.BUILDING_DATABASE, getActiveReports(CONSTANTS.BUILDING_DATABASE), (orgID))

  if(!_.isEmpty(activeRunningReport)) return

  const reportList = [{ name: constants.REPORT_LIST.ISSUE_REPORT.NAME, fn: startIssueReportGeneration(orgName, orgID) }
  ]
  const results = await Promise.allSettled(reportList.map((item) => item.fn))
  for (const result of results) {
    if (result.status === "rejected") {
      Log.error(`[startReportingService] | ${result.reason}`)
    }
  }
}

async function initServiceForReporting() {
  try {
    const orgs = await runQuery(CONSTANTS.BUILDING_DATABASE, getOrganisations(CONSTANTS.BUILDING_DATABASE))
    Log.info(`Starting Reporting Service | ${(orgs.map((org) => org.domain))?.join(', ')}]`)
    orgs.map((org) => {
      startReportingService(org.domain, org.id)
    })
  } catch (error) {
    Log.error(`[initServiceForReporting] Error: ${JSON.stringify(error.message)}`)
    throw new Error("Reporting Service", { cause: error })
  }
}

const main = () => {
  initServiceForReporting()
  setInterval(initServiceForReporting, CONSTANTS.REPORTING_SERVICE_INTERVAL)
}

main()