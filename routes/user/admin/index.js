const router = require('express').Router()
const validateRequest = require('../../../middleware/validateRequest')
const controller = require('./controller')
const { addAdminSchema } = require('./validator')


router.get('/', controller.getUserController)
router.post('/', validateRequest(addAdminSchema), controller.addAdminController)


module.exports = router