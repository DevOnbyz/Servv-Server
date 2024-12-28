const router = require('express').Router()
const controller = require('./controller')

router.post('/razorpay/subscription' ,controller.updateSubscription)
router.post('/razorpay/payment-callback' ,controller.paymentCallback)


module.exports = router