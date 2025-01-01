require('dotenv').config()
const Log = require('../../log')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')
const { verifySignature, handleChargedSubscription, handleChargedPayment } = require('./functions')
require('dotenv').config()

exports.updateSubscription = async (request, response) => {
    try {
        const { event: eventType, payload } = request.body
        const supportedEvents = [CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED]

        if (!supportedEvents.includes(eventType)){
            Log.info(`[ updateSubscription  | Invalid event Type : ${eventType}`)
            return response.status(200).json({ message: 'Invalid event Type' });  
        }
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET)){  
            Log.info(`[ updateSubscription  | Invalid Signature`)
            return response.status(200).json({ message: 'Invalid signature' });  
        }

        const paymentEntity = payload.payment.entity
        const [subscription] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getSubscriptionByRazorpayCustomerId(CONSTANTS.BUILDING_DATABASE), paymentEntity.customer_id)

        if (!subscription){
            Log.info(`[ updateSubscription  | Can't get active subscription`)
            return response.status(200).json({ message: 'Cant get active subscription' });  
        }
        if (subscription.status === CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE){   
            Log.info(`[ updateSubscription  | subscription is already activated`)
            return response.status(200).json({ message: 'subscription is already activated' });  
        }

        switch (eventType) {
            case CONSTANTS.SUBSCRIPTION_WEBHOOK_EVENT.CHARGED:
                await handleChargedSubscription(subscription, paymentEntity, payload)
                break

            default:
                Log.info(`[ updateSubscription  | Invalid event Type:${eventType}`)
                return response.status(200).send('Invalid event Type')
        }

        return response.status(200).send('Webhook received')

    } catch (error) {
        Log.error(`[ updateSubscription  | Error:${error.message}`)
        return response.status(200).send('Error creating order' + error,)
    }
}

exports.paymentCallback = async (request, response) => {
    try {
        Log.info(`[ paymentCallback  | Webhook received]  | Body: ${JSON.stringify(request.body)}`)
        const { event: eventType, payload } = request.body
        const supportedEvents = [CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED,CONSTANTS.ORDER_WEBHOOK_EVENT.TRANSFER_SETTLED]

        if (!supportedEvents.includes(eventType)){
            Log.info(`[ paymentCallback  | Invalid event Type : ${eventType}`)
            return response.status(200).send('Invalid event Type')
        }
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET)){
            Log.info(`[ updateSubscription  | Invalid Signature`)
            return response.status(200).send('Invalid Signature')
        }

        switch (eventType) {
            case CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED:
                await handleChargedPayment(payload,response)
                break

            default:
                Log.info(`[ updateSubscription  | Invalid event Type:${eventType}`)
                return response.status(200).send('Invalid event Type')
        }

    } catch (error) {
        Log.error(`[ paymentCallback | Error: ${JSON.stringify(error)}]` + error)
        return response.status(200).send('Error creating order' + error,)
    }
}