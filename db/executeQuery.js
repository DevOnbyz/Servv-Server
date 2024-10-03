module.exports = (connection, query, values) => {
  return new Promise((resolve, reject) => {
      connection.query(query, values, function (error, results, fields) {
          connection.release()
          if (error) reject(error)
          resolve(results)
      })
  })
}