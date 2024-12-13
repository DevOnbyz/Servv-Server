const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addResidentSchema, editResidentSchema, addSupportSchema } = require('./validator')

router.get('/:id', controller.getResidentByIDController)
router.get('/', controller.getResidentController)
router.post('/', validateRequest(addResidentSchema), controller.addResidentController)
router.patch('/:id', validateRequest(editResidentSchema), controller.editResidentController)
router.get('/project/:projectID', controller.getResidentByProjectController)
router.post('/support/:id',validateRequest(addSupportSchema), controller.addSupportController)
module.exports = router
