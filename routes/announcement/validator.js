const Joi = require('joi')

const addAnnouncement = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Title is required',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Description is required',
  }),
  project: Joi.array().required().messages({
    'string.empty': 'Project List is required',
  }),
  expiryDate: Joi.date().required().messages({
    'string.empty': 'Expire Date is required',
  })
})

module.exports = { addAnnouncement }
