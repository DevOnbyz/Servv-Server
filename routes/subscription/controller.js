const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const Razorpay = require('razorpay')
require('dotenv').config()
const crypto = require('crypto')


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


exports.getSubscriptionPlansController = async (request, response) => {
    try {
        const plans = await razorpay.subscriptions.all()
        console.log('Fetched plans:', plans)
        return sendHTTPResponse.success(response, 'Subscription plans fetched successfully', plans)

    } catch (error) {
        Log.error(`[Servv | getSubscriptionPlansController | Error in fetching Subscription plans | Error: ${error.error}`)
        sendHTTPResponse.error(response, 'Error while fetching Subscription plans', error.error)
    }
}

exports.createCustomerController = async (request, response) => {
    const username = request.username
    const userID = request.userID
    const email = 'ali@gmail.com' // Use dynamic email if available from the request

    try {
        const customers = await razorpay.customers.all()
        const existingCustomer = customers.items.find(customer => customer.email === email)

        if (existingCustomer) {
            Log.info(`[Servv | createCustomerController | userID:${userID} | Customer already exists`)
            return sendHTTPResponse.success(response, 'Customer already exists', existingCustomer)
        }
        const customer = await razorpay.customers.create({
            name: username,
            email: email,
            fail_existing: 0,
            notes: {
                userId: userID
            }
        })

        Log.info(`[Servv | createCustomerController | userID:${userID} | Customer created`)
        return sendHTTPResponse.success(response, 'User created successfully', customer)

    } catch (error) {
        Log.error(`[Servv | createCustomerController | Error in creating user | Error: ${JSON.stringify(error)}`)
        return sendHTTPResponse.error(response, 'Error in creating user', error)
    }
}

exports.activateSubscription = async (request, response) => {
    const customerID = request.body.customerId
    const userID = request.userID

    try {
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_id: customerID,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
                userId: userID
            }
        })
        return sendHTTPResponse.success(response, 'Subscription activated successfully', subscription)

    } catch (error) {
        Log.error(`[Servv | getSubscriptionPlansController | Error in activating Subscription  | Error: ${error.error}`)
        sendHTTPResponse.error(response, 'Error in activating Subscription ', error.error)
    }
}

exports.verifyPayment = async (request, response) => {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body

        const body = razorpay_payment_id + '|' + razorpay_subscription_id
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex')

        const isAuthentic = expectedSignature === razorpay_signature

        if (isAuthentic) {
            Log.info(`[Servv | verifyPayment | Payment verified successfully`)
            return sendHTTPResponse.success(response, 'Payment verified successfully')
        } else {
            Log.error(`[Servv | verifyPayment | Error in authenticating payment  | Error: ${error.error}`)
            sendHTTPResponse.error(response, 'Error in authenticating payment ', error.error)
        }
    } catch (error) {
        Log.error(`[Servv | verifyPayment | Error in verifying payment  | Error: ${error.error}`)
        sendHTTPResponse.error(response, 'Error in verifying payment ', error.error)
    }
}
