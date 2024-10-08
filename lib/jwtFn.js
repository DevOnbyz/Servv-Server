const jwt = require('jsonwebtoken')
require('dotenv').config()

const jwtSign = (body, options = {}) => {
  return new Promise((resolve, reject) => {
    const signOptions = { ...options }
    if (!signOptions.expiresIn) {
      delete signOptions.expiresIn
    }
    jwt.sign(
      {
        data: body,
      },
      process.env.JWT_SECRET,
      signOptions,
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}

const jwtDecode = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) reject(err)
      resolve(decoded)
    })
  })
}

module.exports = {
  jwtSign,
  jwtDecode,
}
