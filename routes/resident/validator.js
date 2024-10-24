const Joi = require('joi')

const addResidentSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phNum: Joi.string().required(),
  emailID: Joi.string().optional().allow(null),
  project: Joi.array().required(),
})

const editResidentSchema = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  emailID: Joi.string().optional().allow(null),
  project: Joi.array().optional(),
  status: Joi.number().optional(),
})

module.exports = { addResidentSchema, editResidentSchema }
