const router = require('express').Router()
const controller = require('./controller')

router.post('/razorpay/subscription' ,controller.subscriptionWebhook)


module.exports = router