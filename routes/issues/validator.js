const Joi = require('joi')

const addIssueSchema = Joi.object({
  projectID: Joi.string().required().messages({
    'string.empty': 'projectID is required',
  }),
  residentID: Joi.string().required().messages({
    'string.empty': 'residentID is required',
  }),
  apartmentID: Joi.string().required().messages({
    'string.empty': 'apartmentID is required',
  }),
  serviceID: Joi.string().required().messages({
    'string.empty': 'serviceID is required',
  }),
  subServiceID: Joi.string().required().messages({
    'string.empty': 'subServiceID is required',
  }),
  description: Joi.string().optional().allow(null),
  preferred_time: Joi.string().optional().allow(null),
  preferred_date: Joi.string().optional().allow(null),
  img_src: Joi.array().optional().allow(null),
})

module.exports = { addIssueSchema }
