const Joi = require('joi')

const addProjectSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Name is required',
  }),
  city: Joi.string().required().messages({
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
  serviceList: Joi.array().required().messages({
    'string.empty': 'Service List is required',
  }),
  description: Joi.string().optional().allow(null),
  floors: Joi.number().optional().allow(null),
  gmap_link: Joi.string().optional().allow(null),
})
const editProjectSchema = Joi.object({
  city: Joi.string().required().messages({
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
  serviceList: Joi.array().required().messages({
    'string.empty': 'Service List is required',
  }),
  description: Joi.string().optional().allow(null),
  floors: Joi.number().optional().allow(null),
  gmap_link: Joi.string().optional().allow(null),
})

module.exports = { addProjectSchema, editProjectSchema }
