const Joi = require('joi')

const loginSchema = Joi.object({
  username: Joi.string().optional().allow(null),
  password: Joi.string().optional().allow(null),
  token: Joi.string().optional().allow(null),
  userType: Joi.string().required().messages({
    'string.empty': 'User type is required',
  }),
})
const tokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'accessToken is required',
  })
})

module.exports = { loginSchema, tokenSchema }
