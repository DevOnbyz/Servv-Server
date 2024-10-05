const router = require('express').Router()
const validateRequest = require('../../middleware/validateRequest')
const controller = require('./controller')
const { addProjectSchema, editProjectSchema } = require('./validator')

router.get('/', controller.getProjectsController)
router.post('/', validateRequest(addProjectSchema), controller.addProjectController)
router.patch('/:id', validateRequest(editProjectSchema), controller.editProjectController)


module.exports = router