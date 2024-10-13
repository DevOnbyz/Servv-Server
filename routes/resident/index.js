const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addResidentSchema } = require('./validator')

router.get('/', controller.getResidentController)
router.post('/', validateRequest(addResidentSchema), controller.addResidentController)
// router.patch('/:id', validateRequest(editResidentSchema), controller.editServicesController)



module.exports = router
