const runQuery = require("../../db/runQuery");
const CONSTANTS = require("../../lib/constants");
const { unifyDoorNumber } = require("../../lib/function");
const queryBuilder = require("./query");
const _ = require("lodash");
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const runQueryOne = require("../../db/runQueryOne");
const getE164 = require("../../lib/getE164");

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
        orderStatus: payment.status === CONSTANTS.ORDER_STATUS.COMPLETED ? 'COMPLETED' : payment.status === CONSTANTS.ORDER_STATUS.CANCELLED ? 'CANCELLED' : 'PENDING',
        paymentMethod: payment.payment_method,
        razorpayOrderId: payment.razorpay_order_id,
        orderCreatedAt: payment.created_at,
        orderUpdatedAt: payment.updated_at,
      }
    }));
  };

  const validateKeys = (data) => {
    const AddedKeys = Object.keys(data);
    CONSTANTS.BULK_UPLOAD_KEYS.RESIDENT.forEach((key) => {
      if (!AddedKeys.includes(key)) {
        throw new Error(`Missing key: ${key}`);
      }
    })
    return true
  }

  const validateProjectNames = async(orgID, addedProjectNames, projectsUnderOrg) => {
    const invalidProjectNames = []
    const projectNamesList = projectsUnderOrg.map((project) => project.name?.toLowerCase())
    addedProjectNames.forEach((projectName, index) => {
      if (!projectNamesList.includes(projectName?.toLowerCase())) {
        invalidProjectNames.push(`In index ${index} project name ${projectName} does not exist`)
      }
    })

    if (!_.isEmpty(invalidProjectNames)) {
      throw new Error(invalidProjectNames.join(', '))
    }
    return true
  }

  const validateSameDoorNoForProjectInCSV = (completeResidentDetails) => {
    const projectDetails = {}
    completeResidentDetails.forEach((item) => {
      const doorNo = unifyDoorNumber(item?.doorNumber)
      const projectName = item?.projectName?.toLowerCase()
      if (!projectDetails[projectName]) {
        projectDetails[projectName] = {}
      }
      if (projectDetails[projectName]?.[doorNo]) {
        projectDetails[projectName][doorNo].push(item)
      } else {
        projectDetails[projectName][doorNo] = [item]
      }
    })
    const invalidDoorNo = []
    for (const projectName in projectDetails) {
      for (const doorNo in projectDetails[projectName]) {
        if (projectDetails[projectName][doorNo].length > 1) {
          invalidDoorNo.push(`Door number ${doorNo} already exists ${projectDetails[projectName][doorNo].length} times for the project ${projectName} in CSV`)
        }
      }
    }
    if (!_.isEmpty(invalidDoorNo)) {
      throw new Error(invalidDoorNo.join(', '))
    }
    return true
  }

  const validateDoorNoAndAttachProjectID = async(orgID, completeResidentDetails, projectIDNameList) => {
    
    validateSameDoorNoForProjectInCSV(completeResidentDetails)

    const invalidDoorNo = []
    for (item of completeResidentDetails) {
      const doorNo = unifyDoorNumber(item?.doorNumber)
      const projectID = projectIDNameList.find((project) => project.name === item?.projectName?.toLowerCase())?.id
      item.projectID = projectID
      const data = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveApratmentByProjectAndName(CONSTANTS.BUILDING_DATABASE), [projectID, doorNo])
      if (!_.isEmpty(data)) {
        const projectName = data[0].project_name;
        invalidDoorNo.push(`Door number ${doorNo} already exists for the project ${projectName}`)
      }
    }

    if (!_.isEmpty(invalidDoorNo)) {
      throw new Error(invalidDoorNo.join(', '))
    }
    
    return completeResidentDetails
  }

  const countryCodes = {
    India: 'IN',
    UAE: 'AE'
  };
  
  const validateResidentPhNum = (completeResidentDetails) => {
    const inValidNumbers = [];

    completeResidentDetails.forEach((item) => {
      const phoneNumber = parsePhoneNumberFromString(item.mobileNo, countryCodes[item.country]);
      if (!(phoneNumber && phoneNumber.isValid())) 
        inValidNumbers.push(phoneNumber.format('E.164'));
    });
    if (!_.isEmpty(inValidNumbers)) {
      throw new Error(`Invalid phone number: ${inValidNumbers.join(', ')}`);
    }
    return true
  }

  const addAndAttachResidentID = async(orgID, userID, completeResidentDetails) => {
    for (item of completeResidentDetails) {
      const phNum = getE164(item.mobileNo, countryCodes[item.country])
      const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])
      const residentIdentityID = _.isEmpty(phNumDetails) ? (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResidentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum, created_by: userID }]))?.insertId : phNumDetails[0]?.id
      item.residentIdentityID = residentIdentityID
      
      if (!_.isEmpty(phNumDetails)) {
        const residentOrgDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentByPhNumIDAndOrgID(CONSTANTS.BUILDING_DATABASE), [residentIdentityID, orgID])
        item.residentID = !_.isEmpty(residentOrgDetails) ? residentOrgDetails.id : null 
      }else{
        item.residentID = null
      }
    }
    return completeResidentDetails
  }

module.exports = {
    formatPaymentHistory,
    validateKeys,
    validateProjectNames,
    validateDoorNoAndAttachProjectID,
    validateResidentPhNum,
    addAndAttachResidentID
}
  