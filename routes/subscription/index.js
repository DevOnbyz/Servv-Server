const router = require('express').Router()
const controller = require('./controller')

router.get('/plans', controller.getSubscriptionPlansController)
router.post('/create-customer', controller.createCustomerController)
router.post('/activate-subscription', controller.activateSubscription)
router.post('/verify-payment', controller.verifyPayment)


module.exports = router