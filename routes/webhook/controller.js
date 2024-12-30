const moment = require('moment')
require('dotenv').config()
const Log = require('../../log')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')
const { verifySignature, handleChargedSubscription, calculateAllFees, handleChargedPayment, handleTranferPayment } = require('./functions')
const Razorpay = require('razorpay')
require('dotenv').config()

exports.updateSubscription = async (request, response) => {
    try {
        const { event: eventType, payload } = request.body
        const supportedEvents = [CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED]

        if (!supportedEvents.includes(eventType))
            return Log.info(`[ updateSubscription  | Invalid event Type : ${eventType}`)
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET))
            return Log.info(`[ updateSubscription  | Invalid Signature`)

        

        const paymentEntity = payload.payment.entity
        const [subscription] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getSubscriptionByRazorpayCustomerId(CONSTANTS.BUILDING_DATABASE), paymentEntity.customer_id)

        if (!subscription)
            return Log.info(`[ updateSubscription  | Can't get active subscription`)
        if (subscription.status === CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE)
            return Log.info(`[ updateSubscription  | subscription is already activated`)

        switch (eventType) {
            case CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED:
                await handleChargedSubscription(subscription, paymentEntity, payload)
                break

            default:
                return Log.info(`[ updateSubscription  | Invalid event Type:${eventType}`)
        }

        return response.status(200).send('Webhook received')

    } catch (error) {
        return Log.error(`[ updateSubscription  | Error:${error.message}`)
    }
}

exports.paymentCallback = async (request, response) => {
    try {
        const { event: eventType, payload } = request.body
        const supportedEvents = [CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED,CONSTANTS.ORDER_WEBHOOK_EVENT.TRANSFER_SETTLED]

        if (!supportedEvents.includes(eventType))
            return Log.info(`[ paymentCallback  | Invalid event Type : ${eventType}`)
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET))
            return Log.info(`[ updateSubscription  | Invalid Signature`)

        switch (eventType) {
            case CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED:
                await handleChargedPayment(payload)
                break
                
            case CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED:
                await handleTranferPayment(payload)
                break

            default:
                return Log.info(`[ updateSubscription  | Invalid event Type:${eventType}`)
        }

        
    } catch (error) {
        Log.error(`[ paymentCallback | Error: ${JSON.stringify(error)}]`)
        return response.status(500).send('Error creating order' + error,)
    }
}