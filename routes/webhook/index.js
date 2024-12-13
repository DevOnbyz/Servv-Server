const router = require('express').Router()
const controller = require('./controller')

router.post('/' ,controller.subscriptionWebhook)


module.exports = router