const Log = require('../log')

module.exports = async (request, response, next) => {
  try {
    const url = request.originalUrl
    const method = request.method
    const body = request.body
    const query = request.query
    const formData = request.is('multipart/form-data') ? request.body : null
    const formDataFields = formData
      ? Object.keys(formData).reduce((acc, key) => {
          acc[key] = formData[key]
          return acc
        }, {})
      : null

    Log.info(
      `[${url}] ${method} query: ${JSON.stringify(query)} | body: ${JSON.stringify(body)} | formData: ${JSON.stringify(formDataFields)}`
    )

    next()
  } catch (error) {
    Log.error(`Error in request logger: ${error.message}`)
    next()
  }
}
