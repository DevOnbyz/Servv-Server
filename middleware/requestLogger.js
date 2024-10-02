const Log = require('../log')

module.exports = async (request, response, next) => {

    const url = request.originalUrl
    const body = request.body
    const query = request.query
    const method = request.method

    Log.info(`[${url}] ${method} query: ${JSON.stringify(query)} | body: ${JSON.stringify(body)}`)

    next()
}