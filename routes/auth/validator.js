const Joi = require('joi')

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'Username is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
  userType: Joi.string().required().messages({
    'string.empty': 'User type is required',
  }),
})
const tokenSchema = Joi.object({
  accessToken: Joi.string().required().messages({
    'string.empty': 'accessToken is required',
  }),
  refreshToken: Joi.string().required().messages({
    'string.empty': 'accessToken is required',
  })
})

module.exports = { loginSchema, tokenSchema }
