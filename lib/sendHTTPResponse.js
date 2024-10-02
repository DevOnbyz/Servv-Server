module.exports = {
  success: (response, message, data, statusCode) => {
      response.status(statusCode ?? 200).json({
          error: false,
          message: message ?? '',
          data: data ?? {}
      })
  },
  error: (response, message, data, statusCode) => {
      response.status(statusCode ?? 500).json({
          error: true,
          message: message ?? '',
          data: data ?? {}
      })
  },
}