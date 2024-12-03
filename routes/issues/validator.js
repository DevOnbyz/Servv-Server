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
  scheduled_time: Joi.string().optional().allow(null),
  img_src: Joi.array().optional().allow(null),
})

const scheduleSiteVisitSchema = Joi.object({
  notes: Joi.string().optional().allow(null),
  agentID: Joi.number().required().messages({
    'string.empty': 'agentID is required',
  })
})

const reAssignAgentSchema = Joi.object({
  agentID: Joi.number().required().messages({
    'string.empty': 'agentID is required',
  }),
  modifiedVisit: Joi.boolean().required().messages({
    'string.empty': 'modifiedVisit is required',
  }),
  modifiedDate: Joi.string().optional().allow(null),
  modifiedNote: Joi.string().optional().allow(null, ''),
})

const addEstimateSchema = Joi.object({
  materialCharge: Joi.number().required().messages({
    'string.empty': 'materialCharge is required',
  }),
  labourCharge: Joi.number().required().messages({
    'string.empty': 'labourCharge is required',
  }),
  is18PercentGSTApplied: Joi.boolean().required().messages({
    'string.empty': 'is18PercentGSTApplied is required',
  }),
  isInclusiveTax: Joi.boolean().required().messages({
    'string.empty': 'isInclusiveTax is required',
  }),
  isExlusiveTax: Joi.boolean().required().messages({
    'string.empty': 'isExlusiveTax is required',
  }),
  expiryDate: Joi.string().required().messages({
    'string.empty': 'expiryDate is required',
  }),
  totalCharge: Joi.number().required().messages({
    'string.empty': 'totalCharge is required',
  }),
  notes: Joi.string().optional().allow(null)
})

module.exports = { addIssueSchema, scheduleSiteVisitSchema, reAssignAgentSchema, addEstimateSchema }
