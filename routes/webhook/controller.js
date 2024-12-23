const moment = require('moment')
require('dotenv').config()
const Log = require('../../log')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')
const { verifySignature, handleChargedSubscription } = require('./functions')

exports.subscriptionWebhook = async (request, response) => {
    try {
        const { event: eventType, payload } = request.body
        const supportedEvents = [CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED]

        if (!supportedEvents.includes(eventType))
            return Log.info(`[Servv | subscriptionWebhook  | Invalid event Type : ${eventType}`)
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET))
            return Log.info(`[Servv | subscriptionWebhook  | Invalid Signature`)
        
        const paymentEntity = payload.payment.entity
        const [subscription] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getSubscriptionByRazorpayCustomerId(CONSTANTS.BUILDING_DATABASE), paymentEntity.customer_id)
        
        if (!subscription)
            return Log.info(`[Servv | subscriptionWebhook  | Can't get active subscription`)

        switch (eventType) {
            case CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED:
                await handleChargedSubscription(subscription, paymentEntity, payload)
                break

            default:
                return Log.info(`[Servv | subscriptionWebhook  | Invalid event Type:${eventType}`)
        }

        return response.status(200).send('Webhook received');

    } catch (error) {
        return Log.error(`[Servv | subscriptionWebhook  | Error:${error.message}`)
    }
}