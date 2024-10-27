const router = require('express').Router()
const validateRequest = require('../../../middleware/validateRequest')
const controller = require('./controller')
const { addAdminSchema, editAdminSchema } = require('./validator')


router.get('/', controller.getUserController)
router.post('/', validateRequest(addAdminSchema), controller.addAdminController)
router.patch('/:id', validateRequest(editAdminSchema) , controller.editAdminController)


module.exports = router