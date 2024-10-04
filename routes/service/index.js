const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addServiceSchema, editServiceSchema } = require('./validator')

router.get('/', controller.getServicesController)
router.post('/', validateRequest(addServiceSchema), controller.addServicesController)
router.patch('/:id', validateRequest(editServiceSchema), controller.editServicesController)


module.exports = router