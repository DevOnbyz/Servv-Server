const router = require('express').Router()
const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addIssueSchema, scheduleSiteVisitSchema, reAssignAgentSchema } = require('./validator')
const multer = require('multer')
const path = require('path')
const Fn = require('./functions')

router.get('/', controller.getIssuesController)
router.get('/stat', controller.getIssueStatController)
router.get('/resident/:id', controller.getIssuesUnderResidentController)

router.post('/', 
  (req, res, next) => {
    Fn.uploadImage(req, res, (err) => {
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
router.get('/:issueID/estimate', controller.getEstimatesController)
router.patch('/:issueID/estimate/approve', controller.approveEstimateController) //an issue has only only one estimate 
router.post('/:issueID/estimate', 
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.addEstimateController(req, res, next)
    })
  }
)
router.patch('/:issueID/close', controller.closeIssueController)

router.get('/:issueID/invoice', controller.getInvoiceController)
router.post('/:issueID/invoice', 
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.addInvoiceController(req, res, next)
    })
  }
)
router.get('/:issueID/history', controller.getIssueHistoryController)
router.post('/:issueID/hold', controller.holdIssueController)

module.exports = router