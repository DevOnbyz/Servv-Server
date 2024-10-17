const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addResidentSchema, editResidentSchema } = require('./validator')

router.get('/', controller.getResidentController)
router.post('/', validateRequest(addResidentSchema), controller.addResidentController)
router.patch('/:id', validateRequest(editResidentSchema), controller.editResidentController)
module.exports = router
