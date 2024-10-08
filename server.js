const express = require('express')
const cors = require('cors')
const ip = require('ip')

const app = express()
const http = require('http').createServer(app)
const cookieParser = require('cookie-parser');

const requestLogger = require('./middleware/requestLogger')
const Log = require('./log')
const routes = require('./routes')
const authRouter = require('./routes/auth')
const sendHTTPResponse = require('./lib/sendHTTPResponse')
const authenticationMiddleware = require('./middleware/authenticationMiddleware')

require('dotenv').config()
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_DOMAIN,
  credentials: true,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(requestLogger)
app.use('/auth',authRouter)
app.use(authenticationMiddleware)
app.use('/api', routes)

app.use((request, response) => {
  sendHTTPResponse.error(response, 'Not Found', null, 404)
});

http.listen(process.env.PORT, () => {
  Log.info(`Running App on http://${ip.address()}:${process.env.PORT}`)
})
