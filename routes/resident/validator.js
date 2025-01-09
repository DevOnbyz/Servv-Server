const Joi = require('joi')

const addResidentSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required().allow(null),
  phNum: Joi.string().required(),
  emailID: Joi.string().optional().allow(null),
  apartments: Joi.array().required(),
})

const editResidentSchema = Joi.object({
  firstname: Joi.string().optional(),
  lastname: Joi.string().optional().allow(null),
  emailID: Joi.string().optional().allow(null),
  apartments: Joi.array().optional(),
  status: Joi.number().optional(),
})

const addSupportSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
})

module.exports = { addResidentSchema, editResidentSchema, addSupportSchema }
