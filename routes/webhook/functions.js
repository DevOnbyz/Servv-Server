const moment = require('moment')  
const crypto = require('crypto')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const runQuery = require('../../db/runQuery')

const verifySignature = (body, signature, secret) => {
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
    
    const nextBillingDate = moment.unix(payload.subscription.entity.charge_at).utc().format('YYYY-MM-DD HH:mm:ss')  
    
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.subscriptionLog(CONSTANTS.BUILDING_DATABASE), subscriptionLog)  
    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateSubscription(CONSTANTS.BUILDING_DATABASE), [{ status: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE, next_billing_date: nextBillingDate }, subscription.id])  
}  

module.exports = {  
    handleChargedSubscription,  
    verifySignature
}
