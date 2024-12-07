const router = require('express').Router()
const validateRequest = require('../../../middleware/validateRequest')
const controller = require('./controller')
const { addAgentSchema, editAgentSchema } = require('./validator')


router.get('/', controller.getAgentController)
router.post('/', validateRequest(addAgentSchema), controller.addAgentController)
router.patch('/:id', validateRequest(editAgentSchema) , controller.editAgentController)
router.get('/service/:serviceID', controller.getAgentsByServiceController)
router.get('/assignment', controller.getAgentAssignmentsController)
router.get('/assignment/:assignmentID', controller.getAssignmentByIDController  )


module.exports = router