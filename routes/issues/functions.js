const multer = require('multer')
const runQuery = require('../../db/runQuery')
const runQueryOne = require('../../db/runQueryOne')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const queryBuilder = require('./query')
const CONSTANTS = require('../../lib/constants')

exports.saveFileToDisk = (file, destination) => {
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

exports.uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'))
  },
}).array('imgSrc', 5)

exports.uploadImageAndFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpeg|jpg|png/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only .pdf, .jpeg, .jpg, and .png files are allowed!'))
  },
}).single('file')

exports.closeIssueQueries = async (issueID) => {
  // if a site visit is assigned to issue then make to cancelled OR if a workorder is assigned to issue then make to cancelled
  const activeSiteVisit = (await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveSiteVisitByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID]))
  if(!_.isEmpty(activeSiteVisit)) {
    const activeSiteVisitID = activeSiteVisit.id
    const updatedAgentAssignmentData = {
      status: CONSTANTS.AGENT_ASSIGNMENT_STATUS.CANCELLED
    }
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateAgentAssignmentByID(CONSTANTS.BUILDING_DATABASE), [ updatedAgentAssignmentData, activeSiteVisitID ])
  }

  // if a estimate is assigned to issue then make to cancelled
  await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.cancelEstimateByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
  await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.closeIssueByID(CONSTANTS.BUILDING_DATABASE), [issueID])

}
