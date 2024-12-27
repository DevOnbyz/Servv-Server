const router = require('express').Router()
const controller = require('./controller')

router.post('/create-order', controller.createOrder)
router.post('/verify-payment', controller.verifyPayment)


module.exports = router