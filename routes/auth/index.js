const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { loginSchema, tokenSchema } = require('./validator')

router.post('/login', validateRequest(loginSchema) ,controller.loginController)
router.post('/token', validateRequest(tokenSchema) ,controller.regenreateTokenController)


module.exports = router