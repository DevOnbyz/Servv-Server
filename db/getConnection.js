module.exports = (pool) => {
  return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
          if (err) reject(err)
          resolve(connection)
      })
  })
}

