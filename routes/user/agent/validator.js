const Joi = require('joi')

const addAgentSchema = Joi.object({
  firstname: Joi.string().required().messages({
    'string.empty': 'Firstname is required',
  }),
  lastname: Joi.string().required().messages({
    'string.empty': 'Lastname is required',
  }),
  email: Joi.string().required().messages({
    'string.empty': 'Email is required',
  }),
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
})

const editAdminSchema = Joi.object({
  firstname: Joi.string().required().messages({
    'string.empty': 'Firstname is required',
  }),
  lastname: Joi.string().required().messages({
    'string.empty': 'Lastname is required',
  }),
  password: Joi.string().optional().allow(null),
  username: Joi.string().required().messages({
    'string.empty': 'Username is required',
  }),
  email: Joi.string().required().messages({
    'string.empty': 'Email is required',
  }),
  phNum: Joi.string().required().messages({
    'string.empty': 'Phone Number is required',
  }),
  roleID: Joi.number().optional().allow(null),
  project: Joi.array().required().messages({
    'string.empty': 'Project List is required',
  }),
  isPasswordChanged: Joi.boolean().optional().allow(null),
})

module.exports = { addAgentSchema, editAdminSchema }
