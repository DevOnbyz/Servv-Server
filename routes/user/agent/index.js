const router = require('express').Router()
const validateRequest = require('../../../middleware/validateRequest')
const controller = require('./controller')
const { addAgentSchema, editAdminSchema } = require('./validator')


router.get('/', controller.getAgentController)
router.post('/', validateRequest(addAgentSchema), controller.addAgentController)
// router.patch('/:id', validateRequest(editAdminSchema) , controller.editAdminController)


module.exports = router