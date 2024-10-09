const sendHTTPResponse = require('../lib/sendHTTPResponse')
const jwt = require('jsonwebtoken')

module.exports = async (request, response, next) => {
  const authHeader = request.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) return sendHTTPResponse.error(response, 'Unauthorized', null, 401)

  try {
    const decoded = await jwt.verify(token, process.env.JWT_SECRET)
    request.orgID = decoded?.data?.orgID
    request.username = decoded?.data?.username
    request.userID = decoded?.data?.username
    request.userType = decoded?.data?.userType
    next()
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendHTTPResponse.error(response, 'Token Expired', { needRefresh: true }, 403)
    }
    return sendHTTPResponse.error(response, 'Invalid Token', null, 403)
  }
}
