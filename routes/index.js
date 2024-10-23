const router = require('express').Router()
const serviceRouter = require('./service')
const projectRouter = require('./project')
const residentRouter = require('./resident')
const userRouter = require('./user')

router.use('/service', serviceRouter)
router.use('/project', projectRouter)
router.use('/resident', residentRouter)
router.use('/user', userRouter)

module.exports = router