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
const addResidentSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phNum: Joi.string().required(),
  emailID: Joi.string().required(),
  project: Joi.array().required(),
})

module.exports = { addServiceSchema, addResidentSchema }
