const Joi = require('joi')

const addAdminSchema = Joi.object({
  firstname: Joi.string().required().messages({
    'string.empty': 'Firstname is required',
  }),
  lastname: Joi.string().required().messages({
    'string.empty': 'Lastname is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
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

module.exports = { addAdminSchema, editAdminSchema }
