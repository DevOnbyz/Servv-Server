const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const moment = require('moment')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { getAllProjectsByOrgID } = require('../../db/query')

const formDataLogger = (formData) => {
  if (formData) {
    const loggableData = { ...formData };
    if (loggableData.file) delete loggableData.file;
    if (loggableData.password) delete loggableData.password;
    console.log("Form Data:", JSON.stringify(loggableData, null, 2));
  } else {
    console.log("Form Data Logger: No data provided.");
  }
};


exports.getAnnouncemntsController = async (request, response) => {
  const orgID = request.orgID
  try {
    const announcementList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAnnouncementsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    const projectNames = await runQuery(CONSTANTS.BUILDING_DATABASE, getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), orgID)
    const dateFormattedData = announcementList?.map((announcement) => {
      const projectList = !_.isEmpty(announcement.project_id) ? (JSON.parse(announcement.project_id))?.map((project) => parseInt(project)) : []
      const projectAssociated = (projectNames?.filter((project) => projectList?.includes(project.id)))?.map((project) => project.name)
      return {
        ...announcement,
        project: projectAssociated,
        created_at: moment(announcement.created_at).format('DD-MM-YYYY'),
        expire_date: moment(announcement.expire_date).format('DD-MM-YYYY'),
        duration: moment(announcement.expire_date).startOf('day').diff(moment(announcement.created_at).startOf('day'), 'days'),
        img_src: announcement.img_src ? announcement.img_src : null
      }
    })
    for (const announcement of dateFormattedData) {
      announcement.response = []
    }
    return sendHTTPResponse.success(response, 'Announcement List fetched successfully', dateFormattedData)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getAnnouncemntsController | Error in fetching announcement list | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching announcement list', error.message)
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
exports.addAnnouncementController = async (request, response) => {
  formDataLogger(request.body)

  const orgID = request.orgID
  try {
    const title = request.body.title
    const description = request.body.description
    const projectList = request.body.project
    const expiryDate = request.body.expiryDate ? moment(request.body.expiryDate, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss') : null

    if (_.isEmpty(title))
      return sendHTTPResponse.error(response, 'Title cannot be empty', null, 400)
    if (_.isEmpty(projectList))
      return sendHTTPResponse.error(response, 'Please select atleast one project', null, 400)
    if (_.isEmpty(expiryDate))
      return sendHTTPResponse.error(response, 'Please select expire date', null, 400)
    if (expiryDate == 'Invalid date')
      return sendHTTPResponse.error(response, 'Please select expire date', null, 400)
    if (expiryDate < moment().format('YYYY-MM-DD HH:mm:ss'))
      return sendHTTPResponse.error(response, 'Please select expire date greater than current date', null, 400)

    const allAnnouncements = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAnnouncementsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    const duplicateTitle = allAnnouncements.some((announcement) => announcement.title === title)
    if (duplicateTitle)
      return sendHTTPResponse.error(response, 'Title already exists for another announcement', null, 400)

    if (request.file) {
      const destination = 'uploads/announcement/'
      const savedFilePath = await saveFileToDisk(request.file, destination)
      request.body.imgSrcPath = savedFilePath
      request.body.filename = request.file.originalname
    }

    const announcementData = {
      title,
      description,
      org_id: orgID,
      project_id: JSON.stringify(projectList),
      expire_date: expiryDate,
      img_src: request.file ? request.body.imgSrcPath : null,
      filename: request.body.filename ?? null,
      created_by: request.userID
    }
    const insertID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addAnnouncementToOrg(CONSTANTS.BUILDING_DATABASE), [announcementData]))?.insertId
    return sendHTTPResponse.success(response, 'Announcement added successfully', { announcementID: insertID })
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | addAnnouncementController | Error in adding announcement | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error on adding announcement', error.message)
  }
}

exports.editAnnouncementController = async (request, response) => {
  formDataLogger(request.body)

  const orgID = request.orgID
  const announcementId = request.params.id
  try {
    const title = request.body.title
    const description = request.body.description
    const projectList = request.body.project
    const expiryDate = request.body.expiryDate ? moment(request.body.expiryDate, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss') : null
    const isImageEdit = request.body.isImageEdit === 'true'
    const isImageRemoved = request.body.isImageRemoved === 'true'

    if (_.isEmpty(title))
      return sendHTTPResponse.error(response, 'Title cannot be empty', null, 400)
    if (_.isEmpty(projectList))
      return sendHTTPResponse.error(response, 'Please select atleast one project', null, 400)
    if (_.isEmpty(expiryDate))
      return sendHTTPResponse.error(response, 'Please select expire date', null, 400)
    if (expiryDate == 'Invalid date')
      return sendHTTPResponse.error(response, 'Please select expire date', null, 400)

    const allAnnouncements = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllAnnouncementsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    const duplicateTitle = allAnnouncements.some((announcement) => announcement.title === title && announcement.id != announcementId)

    if (duplicateTitle)
      return sendHTTPResponse.error(response, 'Title already exists for another announcement', null, 400)

    const oldAnnouncement = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAnnouncementById(CONSTANTS.BUILDING_DATABASE), [announcementId])
    let imgSrcPath = oldAnnouncement[0].img_src
    let filename = oldAnnouncement[0].filename

    if (isImageRemoved) {
      imgSrcPath && fs.unlink(imgSrcPath, err => err && Log.error(`Failed to delete image: ${imgSrcPath}. Error: ${err.message}`))
      imgSrcPath = filename = null
    } else if (isImageEdit && request.file) {
      imgSrcPath && fs.unlink(imgSrcPath, err => err && Log.error(`Failed to delete old image: ${imgSrcPath}. Error: ${err.message}`))
      imgSrcPath = await saveFileToDisk(request.file, 'uploads/announcement/')
      filename = request.file.originalname
    }

    const announcementData = {
      title,
      description,
      project_id: JSON.stringify(projectList),
      expire_date: expiryDate,
      img_src: imgSrcPath,
      filename: filename,
      created_by: request.userID,
      updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAnnouncement(CONSTANTS.BUILDING_DATABASE), [announcementData, announcementId])
    return sendHTTPResponse.success(response, 'Announcement updated successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editAnnouncementController | Error in updating announcement | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error on updating announcement', error.message)
  }
}