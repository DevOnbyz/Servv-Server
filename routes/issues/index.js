const router = require('express').Router()
const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addIssueSchema, scheduleSiteVisitSchema, reAssignAgentSchema } = require('./validator')
const multer = require('multer')
const path = require('path')


const upload = multer({
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



router.get('/', controller.getIssuesController)
router.get('/resident/:id', controller.getIssuesUnderResidentController)

router.post('/', 
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
      }
      controller.addIssueController(req, res, next)
    })
  }
)
router.post('/:issueID/schedule-visit', validateRequest(scheduleSiteVisitSchema), controller.scheduleVisitIssueController)
router.patch('/:issueID/site-visit/re-assign',validateRequest(reAssignAgentSchema), controller.reAssignSiteVisitController)

router.get('/:issueID/site-visit', controller.getSiteVisitUnderIssueController)
router.post('/:issueID/work-order', validateRequest(scheduleSiteVisitSchema), controller.workOrderIssueController)

module.exports = router
