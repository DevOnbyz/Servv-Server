const moment = require('moment')  
const crypto = require('crypto')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')

function verifySignature (body, signature, secret) {
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
    
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.subscriptionLog(CONSTANTS.BUILDING_DATABASE), subscriptionLog)  
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

module.exports = {  
    handleChargedSubscription,  
    verifySignature,
    calculateAllFees
}
