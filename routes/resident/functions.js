const CONSTANTS = require("../../lib/constants");

const formatPaymentHistory = (paymentHistory) => {
    return paymentHistory.map(payment => ({
      paymentId: payment.id,
      orgId: payment.org_id,
      serviceName: payment.serviceName,
      orderId: payment.order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      totalAmount: payment.total_amount,
      platformFee: payment.platform_fee,
      razorpayFee: payment.razorpay_fee,
      finalAmount: payment.final_amount,
      status: payment.status === CONSTANTS.PAYMENT_STATUS.COMPLETED ? 'COMPLETED' : payment.status === CONSTANTS.PAYMENT_STATUS.FAILED ? 'FAILED' : 'PENDING',
      transferId: payment.transfer_id,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      orderDetails: {
        issueId: payment.issue_id,
        invoiceId: payment.invoice_id,
        orderAmount: payment.amount,
        orderStatus: payment.status === CONSTANTS.ORDER_STATUS.CANCELLED ? 'COMPLETED' : payment.status === CONSTANTS.ORDER_STATUS.CANCELLED ? 'CANCELLED' : 'PENDING',
        paymentMethod: payment.payment_method,
        razorpayOrderId: payment.razorpay_order_id,
        orderCreatedAt: payment.created_at,
        orderUpdatedAt: payment.updated_at,
      }
    }));
  };
  

module.exports = {
    formatPaymentHistory
}
  