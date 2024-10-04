const router = require('express').Router()
const serviceRouter = require('./service')
const projectRouter = require('./project')

router.use('/service', serviceRouter)
router.use('/project', projectRouter)

module.exports = router