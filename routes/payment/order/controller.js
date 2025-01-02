const sendHTTPResponse = require('../../../lib/sendHTTPResponse')
const Log = require('../../../log')
const queryBuilder = require('./query')
const CONSTANTS = require('../../../lib/constants')
const _ = require('lodash')
const Razorpay = require('razorpay')
const runQueryOne = require('../../../db/runQueryOne')
require('dotenv').config()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

//trigger when user clicks the payment button
exports.createOrder = async (request, response) => {
    const orgID = request.orgID
    const domain = request.domain
    const issueID = request.params.issueID ? parseInt(request.params.issueID) : null

    try {

        if (!issueID)
            return sendHTTPResponse.error(response, 'Invalid issue id', null, 400)

        const invoiceData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getInvoiceByIssueID(CONSTANTS.BUILDING_DATABASE), [issueID])
        if (_.isEmpty(invoiceData))
            return sendHTTPResponse.error(response, 'No active invoice found for this issue', null, 400)

        const razorpayOrder = await razorpay.orders.create({
            amount: invoiceData.total_charge * 100,
            currency: 'INR',
            notes: {
                issue_id: issueID,
                invoice_id: invoiceData.id,
                org_id: orgID,
                user_type: request?.userType,
                user_id:request?.userID
            },
        })

        Log.info(`[${domain} | OrganisationID:${orgID} | Order created successfully | Razorpay Order ID: ${razorpayOrder.id}]`)
        return sendHTTPResponse.success(response, 'order verified successfully', { orderId: razorpayOrder.id })

    } catch (error) {
        Log.error(`[${domain} | verifyOrder | Error in creating razorpay order  | Error: ${JSON.stringify(error)}`)
        sendHTTPResponse.error(response, 'Error in creating razorpay order ')
    }
}

//trigger after successfull payment
exports.verifyOrder = async (request, response) => {
    const domain = request.domain

    try {
        
        const { razorpay_payment_id, razorpay_order_id,razorpay_signature } = request.body

        if (!razorpay_payment_id || !razorpay_order_id)
            return sendHTTPResponse.error(response, 'Missing Razorpay payment or order ID')

        const orderDetails = await razorpay.orders.fetch(razorpay_order_id)

        const captureAmount = orderDetails.amount
        await razorpay.payments.capture(razorpay_payment_id, captureAmount)

        return sendHTTPResponse.success(response, 'Payment verified successfully')

    } catch (error) {
        Log.error(`[${domain} | verifyOrder | Error in verifying Razorpay order | Error: ${error}`)
        sendHTTPResponse.error(response, 'Error in verifying Razorpay order',error)
    }
}
