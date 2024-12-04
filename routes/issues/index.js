const router = require('express').Router()
const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addIssueSchema, scheduleSiteVisitSchema, reAssignAgentSchema, recordPaymentSchema, preferredTimeSchema } = require('./validator')
const multer = require('multer')
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

// Site Visit

router.post('/:issueID/schedule-visit', validateRequest(scheduleSiteVisitSchema), controller.scheduleVisitIssueController)
router.patch('/:issueID/site-visit/re-assign',validateRequest(reAssignAgentSchema), controller.reAssignSiteVisitController)
router.patch('/:issueID/site-visit/cancel', controller.cancelSiteVisitController)

router.patch('/:issueID/site-visit/complete', 
  (req, res, next) => {
    Fn.uploadImage(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
      }
      controller.completeSiteVisitController(req, res, next)
    })
  }
)
router.get('/:issueID/site-visit', controller.getSiteVisitUnderIssueController)

// Work Order

router.get('/:issueID/work-order', controller.getWorkOrderUnderIssueController)
router.post('/:issueID/work-order', validateRequest(scheduleSiteVisitSchema), controller.workOrderIssueController)
router.patch('/:issueID/work-order/re-assign',validateRequest(reAssignAgentSchema), controller.reAssignWorkOrderController )
router.patch('/:issueID/work-order/cancel', controller.cancelWorkOrderController)
router.patch('/:issueID/work-order/complete', 
  (req, res, next) => {
    Fn.uploadImage(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading image', err.message)
      }
      controller.completeWorkOrderController(req, res, next)
    })
  }
)

// Estimate

router.get('/:issueID/estimate', controller.getEstimatesController)
router.patch('/:issueID/estimate/approve', controller.approveEstimateController) //an issue has only only one estimate 
router.patch('/:issueID/estimate/send', controller.sendEstimateController) //an issue has only only one estimate 
router.post('/:issueID/estimate', 
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.addAndSendEstimateController(req, res, next)
    })
  }
)
router.patch('/:issueID/estimate/edit',
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.editEstimateController(req, res, next)
    })
  }
)
router.patch('/:issueID/estimate/reject', controller.rejectEstimateController)
router.delete('/:issueID/estimate', controller.deleteEstimateController)

// Invoice

router.get('/:issueID/invoice', controller.getInvoiceController)
router.post('/:issueID/invoice', 
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.addAndSentInvoiceController(req, res, next)
    })
  }
)
router.patch('/:issueID/invoice/edit',
  (req, res, next) => {
    Fn.uploadImageAndFile(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return sendHTTPResponse.error(res, 'Error while uploading file', err.message)
      }
      controller.editInvoiceController(req, res, next)
    })
  }
)
router.patch('/:issueID/invoice/approve', controller.approveInvoiceController) //an issue has only only one invoice
router.patch('/:issueID/invoice/record-payment', validateRequest(recordPaymentSchema), controller.recordPaymentController)

router.patch('/:issueID/preferred-time', validateRequest(preferredTimeSchema), controller.addPreferredTimeController)

router.get('/:issueID/history', controller.getIssueHistoryController)

router.post('/:issueID/hold', controller.holdIssueController)

router.patch('/:issueID/close', controller.closeIssueController)

module.exports = router