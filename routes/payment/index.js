const router = require('express').Router()
const orderController = require('./order')
const subscriptionController = require('./subscription')

router.use('/razorpay/subscription', subscriptionController)
router.use('/razorpay/order', orderController)

module.exports = router