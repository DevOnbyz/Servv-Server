const express = require('express')
const cors = require('cors')
const ip = require('ip')

const app = express()
const http = require('http').createServer(app)
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const requestLogger = require('./middleware/requestLogger')
const Log = require('./log')
const routes = require('./routes')
const authRouter = require('./routes/auth')
const webhookRouter = require('./routes/webhook')
const sendHTTPResponse = require('./lib/sendHTTPResponse')
const authenticationMiddleware = require('./middleware/authenticationMiddleware')
const { checkPendingTransfers } = require('./routes/webhook/functions')

require('dotenv').config()
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_DOMAIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));


app.use(requestLogger)
app.use('/webhook',webhookRouter)
app.use('/auth',authRouter)
app.use(authenticationMiddleware)
app.use('/api', routes)

cron.schedule('0 0 * * *', async () => {
  console.log('Running transfer status check...');
  await checkPendingTransfers();
});

app.use((request, response) => {
  sendHTTPResponse.error(response, 'Not Found', null, 404)
});

http.listen(process.env.PORT, () => {
  Log.info(`Running App on http://${ip.address()}:${process.env.PORT}`)
})