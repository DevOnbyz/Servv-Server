const sendHTTPResponse = require('../lib/sendHTTPResponse')
const Log = require('../log')
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false })
  if (error){
    Log.error(`[Servv] | validateRequest | Error in validating request : ${error.message}`)
    return sendHTTPResponse.error(res, 'Validation error',  error.details.map(err => err.message), 400)
  }
  next()
}

module.exports = validateRequest
