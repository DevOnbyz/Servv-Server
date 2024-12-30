const moment = require('moment')
const crypto = require('crypto')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')
const Log = require('../../log')
const Razorpay = require('razorpay')
require('dotenv').config()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

function verifySignature(body, signature, secret) {
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    return expectedSignature === signature
}

async function handleChargedSubscription(subscription, paymentEntity, payload) {
    const subscriptionLog = {
        subscription_id: subscription.id,
        transaction_id: paymentEntity.id,
        amount: paymentEntity.amount / 100,
        payment_date: moment.unix(paymentEntity.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
        status: CONSTANTS.SUBSCRIPTION_LOG_STATUS.COMPLETED
    }

    const nextBillingDate = moment.unix(payload.subscription.entity.current_end).utc().format('YYYY-MM-DD HH:mm:ss')

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addSubscriptionLog(CONSTANTS.BUILDING_DATABASE), subscriptionLog)
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateSubscription(CONSTANTS.BUILDING_DATABASE), [{ status: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE, next_billing_date: nextBillingDate }, subscription.id])
}

function extractRazorpayFees(razorpayPayload) {
    const { fee, tax, payment_method_details } = razorpayPayload

    return {
        baseFee: fee ? (fee - (tax || 0)) / 100 : 0,
        tax: tax ? tax / 100 : 0,
        methodDetails: payment_method_details || {}
    }
}

function calculateAllFees(amount, razorpayPayload) {
    // Convert amount from paise to rupees
    const amountInRupees = amount / 100;

    const razorpayFees = extractRazorpayFees(razorpayPayload);
    const razorpayBaseFee = razorpayFees.baseFee;
    const razorpayGST = razorpayFees.tax;
    const razorpayRouteCharge = razorpayFees.methodDetails.fee || 0;
    const totalRazorpayFee = razorpayBaseFee + razorpayRouteCharge;

    // Calculate company fee
    const companyBaseFee = (amountInRupees * CONSTANTS.FEES.COMPANY.PERCENTAGE) / 100;
    const companyGST = (companyBaseFee * CONSTANTS.FEES.COMPANY.GST_PERCENTAGE) / 100;

    // Calculate total deductions and finalAmount amount
    const totalDeductions = totalRazorpayFee + razorpayGST + companyBaseFee + companyGST;
    const finalAmount = amountInRupees - totalDeductions;

    return {
        razorpay: {
            baseFee: razorpayBaseFee,
            routeCharge: razorpayRouteCharge,
            gst: razorpayGST,
            total: totalRazorpayFee + razorpayGST
        },
        company: {
            baseFee: companyBaseFee,
            gst: companyGST,
            total: companyBaseFee + companyGST
        },
        finalAmount,
        totalDeductions
    };
}

async function handleChargedPayment(payload) {
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
        org_id: paymentEntity.notes.org_id,
        razorpay_payment_id: paymentEntity.id,
        total_amount: paymentEntity.amount / 100,
        platform_fee: feeCalculation.company.total,
        razorpay_fee: feeCalculation.razorpay.total,
        final_amount: feeCalculation.finalAmount,
        transfer_id: transfer?.items[0].id ?? null,
        status: CONSTANTS.PAYMENT_STATUS.PENDING
    }

    const paymentResult = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addPayment(CONSTANTS.BUILDING_DATABASE), [paymentData])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateIssue(CONSTANTS.BUILDING_DATABASE), [{ payment_id: paymentResult.insertId }, issueID])
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateOrder(CONSTANTS.BUILDING_DATABASE), [{ status: CONSTANTS.ORDER_STATUS.COMPLETED, payment_status: CONSTANTS.PAYMENT_STATUS.PENDING }, orderResult.insertId])

    return response.status(200).send('Webhook received for create order')
}

async function handleTranferPayment(payload){

    const tranferEntity = payload.transfer.entity

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updatePayment(CONSTANTS.BUILDING_DATABASE), [{status: CONSTANTS.PAYMENT_STATUS.COMPLETED},tranferEntity.id])
    const paymentResult = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getPaymentByTransferID(CONSTANTS.BUILDING_DATABASE), tranferEntity.id)
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateOrder(CONSTANTS.BUILDING_DATABASE), [{payment_status: CONSTANTS.PAYMENT_STATUS.COMPLETED }, paymentResult.order_id])
}

module.exports = {
    handleChargedSubscription,
    verifySignature,
    calculateAllFees,
    handleChargedPayment,
    handleTranferPayment
}
