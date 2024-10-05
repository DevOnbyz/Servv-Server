const Joi = require('joi')

const addServiceSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  description: Joi.string().optional(),
})
const editServiceSchema = Joi.object({
  description: Joi.string().optional(),
  status: Joi.number().optional(),
})

module.exports = { addServiceSchema, editServiceSchema }
