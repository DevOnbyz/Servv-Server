const router = require('express').Router()
const controller = require('./controller')

router.get('/plans', controller.getActivePlan)
router.get('/active-subscription', controller.getActiveSubscriptionByOrgID)
router.post('/activate-subscription', controller.activateSubscription)
router.post('/verify-payment', controller.verifyPayment)


module.exports = router