const Joi = require('joi')

const addAgentSchema = Joi.object({
  firstname: Joi.string().required().messages({
    'string.empty': 'Firstname is required',
  }),
  lastname: Joi.string().required().messages({
    'string.empty': 'Lastname is required',
  }),
  email: Joi.string().optional().allow(null),
  phNum: Joi.string().required().messages({
    'string.empty': 'Phone Number is required',
  }),
  serviceList: Joi.array().required().messages({
    'string.empty': 'Service List is required',
  }),
  city : Joi.string().required().messages({
    'string.empty': 'City is required',
  }),
  district: Joi.string().required().messages({
    'string.empty': 'District is required',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required',
  }),
  country: Joi.string().required().messages({
    'string.empty': 'Country is required',
  }),
  roleId: Joi.number().required().messages({
    'number.empty': 'roleId is required',
  }),
})

const editAgentSchema = Joi.object({
  firstname: Joi.string().required().messages({
    'string.empty': 'Firstname is required',
  }),
  lastname: Joi.string().required().messages({
    'string.empty': 'Lastname is required',
  }),
  email: Joi.string().optional().allow(null),
  phNum: Joi.string().required().messages({
    'string.empty': 'Phone Number is required',
  }),
  serviceList: Joi.array().required().messages({
    'string.empty': 'Service List is required',
  }),
  city : Joi.string().required().messages({
    'string.empty': 'City is required',
  }),
  district: Joi.string().required().messages({
    'string.empty': 'District is required',
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required',
  }),
  country: Joi.string().required().messages({
    'string.empty': 'Country is required',
  }),
  roleId: Joi.number().required().messages({
    'number.empty': 'roleId is required',
  }),
})

module.exports = { addAgentSchema, editAgentSchema }
