const router = require('express').Router()
const adminController = require('./admin')
const agentController = require('./agent')

router.use('/admin', adminController)
// router.use('/agent', agentController)

module.exports = router