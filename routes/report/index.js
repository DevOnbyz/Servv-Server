const router = require('express').Router()
const controller = require('./controller')
const validateRequest = require('../../middleware/validateRequest')
const { addReportSchema } = require('./validator')

router.get('/', controller.getReportsController)
router.post('/', validateRequest(addReportSchema), controller.addReportController)


module.exports = router