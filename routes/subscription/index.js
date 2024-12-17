const router = require('express').Router()
const controller = require('./controller')

router.post('/activate-subscription', controller.activateSubscription)
router.post('/verify-payment', controller.verifyPayment)


module.exports = router