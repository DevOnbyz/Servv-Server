const router = require('express').Router()
const controller = require('./controller')

router.post('/' ,controller.webhook)


module.exports = router