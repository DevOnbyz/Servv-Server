const {REPORT_LIST} = require('../../lib/constants')

function getReportTypeDetails(typeValue) {
  for (const key in REPORT_LIST) {
    if (REPORT_LIST[key].VALUE === typeValue) {
      return REPORT_LIST[key]
    }
  }
  return null
}

module.exports = {
  getReportTypeDetails
}