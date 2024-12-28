const router = require('express').Router()
const controller = require('./controller')

router.post('/create-order/:issueID', controller.createOrder)

module.exports = router