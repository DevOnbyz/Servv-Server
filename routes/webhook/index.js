const router = require('express').Router()
const controller = require('./controller')

router.post('/razorpay/subscription' ,controller.updateSubscription)
router.post('/razorpay/create-order' ,controller.createOrder)


module.exports = router