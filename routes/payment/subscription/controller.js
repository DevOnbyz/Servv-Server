const sendHTTPResponse = require('../../../lib/sendHTTPResponse')
const runQuery = require('../../../db/runQuery')
const CONSTANTS = require('../../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../../log')
const Razorpay = require('razorpay')
require('dotenv').config()
const crypto = require('crypto')
const moment = require('moment')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
exports.getActivePlan = async (request, response) => {

    try {
        if (!process.env.RAZORPAY_PLAN_ID)
           sendHTTPResponse.error(response, 'Plan ID is required', error.message)

        const plan = await razorpay.plans.fetch(process.env.RAZORPAY_PLAN_ID)

        Log.info(`[Servv | getActivePlan | Successfully fetched plan details ]`)
        sendHTTPResponse.success(response,'Successfully fetched plan details', [plan])
    } catch (error) {
        Log.error(`[Servv | getActivePlan | Error fetching plan details | Error: ${error.message}]`)
        sendHTTPResponse.error(response, 'Error fetching plan details', error.message)
    }
}

exports.getActiveSubscriptionByOrgID = async (request, response) => {
    const orgID = request.orgID
    try {
        const organisation = await runQuery(CONSTANTS.BUILDING_DATABASE,queryBuilder.getOrganisationById(CONSTANTS.BUILDING_DATABASE),[orgID])
        if (!organisation || !organisation[0].razorpay_customer_id) 
            return sendHTTPResponse.error(response, 'User is not an active subscriber')
        
        const subscriptions = await runQuery(CONSTANTS.BUILDING_DATABASE,queryBuilder.getActiveSubscriptions(CONSTANTS.BUILDING_DATABASE),[orgID])
        if (!subscriptions || subscriptions.length === 0)
            return sendHTTPResponse.error(response, 'No active subscription found')
        
        const subscriptionIDs = subscriptions.map(sub => sub.id)
        const paymentLogs = await runQuery(CONSTANTS.BUILDING_DATABASE,queryBuilder.getSubscriptionPaymentLogs(CONSTANTS.BUILDING_DATABASE),[subscriptionIDs])

        const result = subscriptions.map(subscription => ({...subscription,paymentHistory: paymentLogs.filter(log => log.subscription_id === subscription.id)}))

        Log.info(`[Servv | getActiveSubscription | orgID:${orgID} | Subscription data fetched successfully`)
        return sendHTTPResponse.success(response, 'Active subscription data fetched successfully ',result)

    } catch (error) {
        Log.error(`[Servv | getActiveSubscription | Error in fetching subscription | Error: ${JSON.stringify(error.message)}`)
        return sendHTTPResponse.error(response, 'Error in fetching active subscription data', error.message)
    }
}

exports.activateSubscription = async (request, response) => {
    const orgID = request.orgID
    const username = request.username
    const userID = request.userID

    try {
        const customers = await razorpay.customers.all()
        const existingCustomer = customers.items.find(customer => customer.notes && customer.notes.userId === userID)
        const customer = existingCustomer
            ? (Log.info(`[Servv | activateSubscription | userID:${userID} | Customer already exists`), existingCustomer)
            : (await razorpay.customers.create({
                name: username,
                fail_existing: 0,
                notes: {
                    userId: userID,
                },
            }),
            Log.info(`[Servv | activateSubscription | userID:${userID} | Customer created`))


        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_id: customer.id,
            total_count: 12,
            quantity: 1,
            customer_notify: 1,
            notes: {
                userId: userID,
            },
        })

        const subscriptionData = {
            org_id: userID,
            razorpay_subscription_id: subscription.id,
            status: CONSTANTS.SUBSCRIPTION_STATUS.PENDING,
            start_date: moment.unix(subscription.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
            next_billing_date: null
        }
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addSubscription(CONSTANTS.BUILDING_DATABASE), subscriptionData)
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addSubscriptionID(CONSTANTS.BUILDING_DATABASE), [{ razorpay_customer_id: customer.id }, orgID])


        return sendHTTPResponse.success(response, 'User subscription created successfully', { subscription, customer },)
    } catch (error) {
        Log.error(`[Servv | activateSubscription | Error in creating user | Error: ${JSON.stringify(error.message)}`)
        return sendHTTPResponse.error(response, 'Error in creating user subscription', error.message)
    }
}


exports.verifyPayment = async (request, response) => {
    const orgID = request.orgID

    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = request.body
        const body = razorpay_payment_id + '|' + razorpay_subscription_id
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex')
        const isAuthentic = expectedSignature === razorpay_signature

        if (isAuthentic) {
            await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateSubscription(CONSTANTS.BUILDING_DATABASE), [{ status: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE }, orgID])
            Log.info(`[Servv | verifyPayment | Payment verified successfully`)
            return sendHTTPResponse.success(response, 'Payment verified successfully')
        } else {
            Log.error(`[Servv | verifyPayment | Error in authenticating payment  | Error: ${error}`)
            return sendHTTPResponse.error(response, 'Error in authenticating payment ', error)
        }
    } catch (error) {
        Log.error(`[Servv | verifyPayment | Error in verifying payment  | Error: ${error}`)
        sendHTTPResponse.error(response, 'Error in verifying payment ', error)
    }
}
