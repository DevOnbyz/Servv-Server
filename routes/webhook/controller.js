const moment = require('moment')
require('dotenv').config()
const Log = require('../../log')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')
const { verifySignature, handleChargedSubscription, calculateAllFees } = require('./functions')
const Razorpay = require('razorpay')
require('dotenv').config()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

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
        const supportedEvents = [CONSTANTS.ORDER_WEBHOOK_EVENT.CHARGED]

        if (!supportedEvents.includes(eventType))
            return Log.info(`[ paymentCallback  | Invalid event Type : ${eventType}`)
        if (!verifySignature(JSON.stringify(request.body), request.headers['x-razorpay-signature'], process.env.RAZORPAY_KEY_SECRET))
            return Log.info(`[ updateSubscription  | Invalid Signature`)

        const paymentEntity = payload.payment.entity
        const feeCalculation = calculateAllFees(paymentEntity.amount, paymentEntity)

        const [existingOrder] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getOrderByIssueOrInvoiceId(CONSTANTS.BUILDING_DATABASE), [paymentEntity.notes.issue_id, paymentEntity.notes.invoice_id])

        if (existingOrder) {
            Log.info(`[ paymentCallback | Order already exists for issue_id: ${paymentEntity.notes.issue_id} or invoice_id: ${paymentEntity.notes.invoice_id}]`)
            return response.status(409).send('Order already exists')
        }

        const [organisation] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getOrganisationByOrgID(CONSTANTS.BUILDING_DATABASE), [paymentEntity.notes.org_id])  

        if (!organisation?.razorpay_route_account_id) {  
            Log.error(`[ paymentCallback | Error: Razorpay route account not found for the organisation - org_id: ${paymentEntity.notes.org_id}]`)  
            return response.status(404).send('Razorpay route account not found for the organisation')  
        }  

        const orderData = {
            issue_id: paymentEntity.notes.issue_id,
            invoice_id: paymentEntity.notes.invoice_id,
            amount: feeCalculation.finalAmount,
            payment_method: paymentEntity.method,
            razorpay_order_id: paymentEntity.order_id,
            status: CONSTANTS.ORDER_STATUS.PENDING,
            payment_status: CONSTANTS.PAYMENT_STATUS.PENDING
        }

        const orderResult = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addOrder(CONSTANTS.BUILDING_DATABASE), [orderData])

        const transfer = await razorpay.payments.transfer(paymentEntity.id, {
            transfers: [{
                account: organisation?.razorpay_route_account_id,
                amount: Math.round(feeCalculation.finalAmount),
                currency: "INR",
                notes: {
                    issue_id: paymentEntity.notes.issue_id,
                    invoice_id: paymentEntity.notes.invoice_id
                }
            }]
        })

        const paymentData = {
            order_id: orderResult.insertId,
            razorpay_payment_id: paymentEntity.id,
            total_amount: paymentEntity.amount / 100,
            platform_fee: feeCalculation.company.total,
            razorpay_fee: feeCalculation.razorpay.total,
            status: CONSTANTS.PAYMENT_STATUS.COMPLETED,
            final_amount: feeCalculation.finalAmount,
            transfer_id: transfer?.items[0].id ?? null,
            status :  CONSTANTS.PAYMENT_STATUS.PENDING
        }

        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addPayment(CONSTANTS.BUILDING_DATABASE), [paymentData])
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateOrder(CONSTANTS.BUILDING_DATABASE), [{ status: CONSTANTS.ORDER_STATUS.COMPLETED, payment_status: CONSTANTS.PAYMENT_STATUS.COMPLETED }, orderResult.insertId])

        return response.status(200).send('Webhook received for create order')
    } catch (error) {
        Log.error(`[ paymentCallback | Error: ${JSON.stringify(error)}]`)
        return response.status(500).send('Error creating order' + error,)
    }
}