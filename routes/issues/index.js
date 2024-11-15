const router = require('express').Router()
const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addIssueSchema, scheduleSiteVisitSchema, reAssignAgentSchema } = require('./validator')
const multer = require('multer')
const path = require('path')


const uploadImage = multer({
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

const uploadImageAndFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .pdf, .jpeg, .jpg, and .png files are allowed!'));
  },
}).single('estimateFile');



router.get('/', controller.getIssuesController)
router.get('/stat', controller.getIssueStatController)
router.get('/resident/:id', controller.getIssuesUnderResidentController)

router.post('/', 
  (req, res, next) => {
    uploadImage(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
      }
      controller.addIssueController(req, res, next)
    })
  }
)
router.post('/:issueID/schedule-visit', validateRequest(scheduleSiteVisitSchema), controller.scheduleVisitIssueController)
router.patch('/:issueID/site-visit/re-assign',validateRequest(reAssignAgentSchema), controller.reAssignSiteVisitController)
router.patch('/:issueID/site-visit/cancel', controller.cancelSiteVisitController)
router.get('/:issueID/site-visit', controller.getSiteVisitUnderIssueController)
router.get('/:issueID/work-order', controller.getWorkOrderUnderIssueController)
router.post('/:issueID/work-order', validateRequest(scheduleSiteVisitSchema), controller.workOrderIssueController)

router.post('/:issueID/estimate', 
  (req, res, next) => {
    uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
      }
      controller.addEstimateController(req, res, next)
    })
  }
)
module.exports = router
