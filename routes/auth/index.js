const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { loginSchema, tokenSchema } = require('./validator')

router.post('/login', validateRequest(loginSchema) ,controller.loginController)
router.post('/token', validateRequest(tokenSchema) ,controller.regenreateTokenController)
router.get('/resident/check-phone/:phone', controller.checkResidentPhoneController)
router.get('/agent/check-phone/:phone', controller.checkAgentPhoneController)


module.exports = router