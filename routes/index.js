const router = require('express').Router()
const serviceRouter = require('./service')
const projectRouter = require('./project')
const residentRouter = require('./resident')
const userRouter = require('./user')
const announcementRouter = require('./announcement')

router.use('/service', serviceRouter)
router.use('/project', projectRouter)
router.use('/resident', residentRouter)
router.use('/user', userRouter)
router.use('/announcement', announcementRouter)

module.exports = router