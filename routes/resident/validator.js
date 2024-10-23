const Joi = require('joi')

const addResidentSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phNum: Joi.string().optional(),
  emailID: Joi.string().required(),
  project: Joi.array().required(),
})

const editResidentSchema = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional(),
  emailID: Joi.string().optional(),
  project: Joi.array().optional(),
  status: Joi.number().optional(),
})

module.exports = { addResidentSchema, editResidentSchema }
