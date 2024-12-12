const crypto = require('crypto')
const moment = require('moment')
require('dotenv').config()

const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')

const verifySignature = (body, signature, secret) => {
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
    return expectedSignature === signature
}

exports.webhook = async (request, response) => {
    try {
        const { event: eventType, payload } = request.body
        const supportedEvents = ['subscription.charged']
        
        if (!supportedEvents.includes(eventType))
            return
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET))
            return

        const paymentEntity = payload.payment.entity
        const [subscription] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getSubscriptionByRazorpayCustomerId(CONSTANTS.BUILDING_DATABASE), paymentEntity.customer_id)

        if (!subscription)
            throw new Error(`Subscription not found for customer: ${paymentEntity.customer_id}`)

        switch (eventType) {
            case 'subscription.charged':

                const subscriptionLog = {
                    subscription_id: subscription.id,
                    transaction_id: paymentEntity.id,
                    amount: paymentEntity.amount / 100,
                    payment_date: moment.unix(paymentEntity.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
                    status: CONSTANTS.SUBSCRIPTION_LOG_STATUS.COMPLETED
                }
                const nextBillingDate = moment.unix(payload.subscription.entity.charge_at).utc().format('YYYY-MM-DD HH:mm:ss');

                await runQuery(CONSTANTS.BUILDING_DATABASE,queryBuilder.subscriptionLog(CONSTANTS.BUILDING_DATABASE),subscriptionLog)
                await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateSubscription(CONSTANTS.BUILDING_DATABASE), [{status: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE,next_billing_date: nextBillingDate}, subscription.id])
                break

            default:
                return
        }

        return

    } catch (error) {
        console.error('Webhook Error:', error)
    }
}