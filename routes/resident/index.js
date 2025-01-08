const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const multer = require('multer')
const { addResidentSchema, editResidentSchema, addSupportSchema } = require('./validator')
const sendHTTPResponse = require('../../lib/sendHTTPResponse')

const upload = multer({
    limits: {
        fileSize:14000
    }
})

router.get('/:id', controller.getResidentByIDController)
router.get('/', controller.getResidentController)
router.post('/', validateRequest(addResidentSchema), controller.addResidentController)
router.post('/bulk', upload.single('resident-details'), (request, response) => {
    if(request.file){
        return controller.addResidentBulkController(request, response)
    }
    return sendHTTPResponse.error(response, 'Please add csv file to process the request')
})
router.patch('/:id', validateRequest(editResidentSchema), controller.editResidentController)
router.get('/project/:projectID', controller.getResidentByProjectController)
router.post('/support/:id',validateRequest(addSupportSchema), controller.addSupportController)
router.get('/:id/payment', controller.getResidentPaymentHistoryController)
module.exports = router
