const router = require('express').Router()
const serviceRouter = require('./service')
const projectRouter = require('./project')
const residentRouter = require('./resident')

router.use('/service', serviceRouter)
router.use('/project', projectRouter)
router.use('/resident', residentRouter)

module.exports = router