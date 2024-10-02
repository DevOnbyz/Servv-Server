const express = require('express')
const cors = require('cors')
const ip = require('ip')

const app = express()
const http = require('http').createServer(app)

const requestLogger = require('./middleware/requestLogger')
const Log = require('./log')

require('dotenv').config()

// const routes = require('./routes')
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(requestLogger)
// app.use('/api', routes)


http.listen(process.env.PORT, () => {
  Log.info(`Running App on http://${ip.address()}:${process.env.PORT}`)
})
