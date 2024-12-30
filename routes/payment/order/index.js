const router = require('express').Router()
const controller = require('./controller')

router.post('/create-order/:issueID', controller.createOrder)
router.post('/verify-order', controller.verifyOrder)

module.exports = router