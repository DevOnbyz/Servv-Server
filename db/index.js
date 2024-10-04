const mysql = require('mysql')
const dbConfig = require('./dbConfig.json')
const mainPool = mysql.createPool(dbConfig)

module.exports = mainPool