const Joi = require('joi')

const addServiceSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  type: Joi.number().required().messages({
    'string.empty': 'Type is required',
  }),
  description: Joi.string().optional(),
})
const editServiceSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  type: Joi.number().optional(),
  status: Joi.number().optional(),
})

module.exports = { addServiceSchema, editServiceSchema }
