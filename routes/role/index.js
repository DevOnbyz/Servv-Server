const router = require('express').Router()
const controller = require('./controller')

router.get('/', controller.getAllRoleUnderOrg)


module.exports = router