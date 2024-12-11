const router = require('express').Router()
const serviceRouter = require('./service')
const projectRouter = require('./project')
const residentRouter = require('./resident')
const userRouter = require('./user')
const announcementRouter = require('./announcement')
const issueRouter = require('./issues') 
const reportRouter = require('./report')
const subscriptionRouter = require('./subscription')
const { downloadRouter } = require('./controller')


router.use('/service', serviceRouter)
router.use('/project', projectRouter)
router.use('/resident', residentRouter)
router.use('/user', userRouter)
router.use('/announcement', announcementRouter)
router.use('/issue', issueRouter)
router.use('/report', reportRouter)
router.use('/subscription', subscriptionRouter)
router.get('/download/:filename', downloadRouter)

module.exports = router