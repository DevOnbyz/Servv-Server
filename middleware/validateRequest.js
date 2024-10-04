const sendHTTPResponse = require('../lib/sendHTTPResponse')
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false })
  if (error) 
    return sendHTTPResponse.error(res, 'Validation error',  error.details.map(err => err.message), 400)
  next()
}

module.exports = validateRequest
