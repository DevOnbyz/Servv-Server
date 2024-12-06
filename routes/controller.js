const fs = require('fs')
const path = require('path')
const Log = require('../log')
const sendHTTPResponse = require('../lib/sendHTTPResponse')

exports.downloadRouter = (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const filename = request.params.filename
  try {
    const filepath = path.join(__dirname, '../public/downloads', filename)
    if (fs.existsSync(filepath)) {
      response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
      response.setHeader('Content-Type', 'text/csv')
      response.setHeader('Content-Disposition', `attachment filename="${filename}"`)
      response.sendFile(filepath)
  } else {
      return response.send('File Not Found')
  }
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | downloadRouter | ${error.message}`)
    sendHTTPResponse.error(response, 'Error while downloading file', error.message)
  }
}