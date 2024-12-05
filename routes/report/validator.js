const Joi = require('joi')
const { config } = require('../../db')

const addReportSchema = Joi.object({
  config: Joi.object().required().messages({
    'string.empty': 'config is required',
  })
})

module.exports = { addReportSchema }
