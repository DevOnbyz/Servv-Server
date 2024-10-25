const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const moment = require('moment')

exports.getAnnouncemntsController = async (request, response) => {
  const orgID = request.orgID
  try {
    const announcementList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAnnouncementsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    for (const announcement of announcementList) {
      announcement.response = []
    }
    return sendHTTPResponse.success(response, 'Announcement List fetched successfully', announcementList)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getAnnouncemntsController | Error in fetching announcement list`)
    sendHTTPResponse.error(response, 'Error while fetching announcement list', error.message)
  }
}
exports.addAnnouncementController = async (request, response) => {
  const orgID = request.orgID
  try {
    const title = request.body.title
    const description = request.body.description
    const projectList = request.body.project
    const expireDate = request.body.expireDate ? moment(request.body.expireDate, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss') : null
    if(_.isEmpty(title))
      return sendHTTPResponse.error(response, 'Title cannot be empty', null, 400)
    if(_.isEmpty(projectList)) 
      return sendHTTPResponse.error(response, 'Please select atleast one project', null, 400)
    if(_.isEmpty(expireDate))
      return sendHTTPResponse.error(response, 'Please select expire date', null, 400)
    if(expireDate < moment().format('YYYY-MM-DD HH:mm:ss'))
      return sendHTTPResponse.error(response, 'Please select expire date greater than current date', null, 400)
    const announcementData = {
      title,
      description,
      org_id: orgID,
      project_id: JSON.stringify(projectList),
      expire_date: expireDate,
      img_src: request.file ? request.file.path : null, // Use the file path,
      created_by: request.userID
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAnnouncementToOrg(CONSTANTS.BUILDING_DATABASE), [announcementData]))?.insertId
    return sendHTTPResponse.success(response, 'Announcement added successfully', { announcementID: insertID })
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | addAnnouncementController | Error in adding announcement`)
    sendHTTPResponse.error(response, 'Error on adding announcement', error.message)
  }
} 