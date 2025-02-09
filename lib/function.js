const CONSTANTS = require('./constants')
const serviceAccount = require('../firebase/adminConfig.json')
const admin = require("firebase-admin")
const _ = require('lodash')
const Log = require('../log')

const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

function unifyDoorNumber(doorNo) {
  return doorNo?.replace(/\s+/g, '').toUpperCase();
}
function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString()
}
function getSubStatusStringById(id) {
  const statusKey = Object.keys(CONSTANTS.ISSUE_SUB_STATUS_NUM).find(key => CONSTANTS.ISSUE_SUB_STATUS_NUM[key] === id);
  return statusKey ? CONSTANTS.ISSUE_SUB_STATUS_STRING[statusKey] : 'Invalid ID';
}

function blastPushNotification(FCMToken, title, body, image = null) {
Log.info(`blastPushNotification | FCMToken: ${FCMToken}, title: ${title}, body: ${body}, image: ${image}`)
if(_.isEmpty(FCMToken)) return

  firebase.messaging().send({
    notification: {
      title,
      body,
    },
    // android: {
    //   notification: {
    //     imageUrl: image
    //   }
    // },
    token: FCMToken
  })
}

function createResidentMessage(type, data) {
  const messages = {
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.SITE_VISIT_SCHEDULED]: `A site visit for your request (${data.requestId} - ${data.jobTitle}) is scheduled on ${data.dateTime} with ${data.agentName}.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.SITE_VISIT_RESCHEDULED]: `Your site visit for ${data.requestId} - ${data.jobTitle} has been rescheduled to ${data.newDateTime} with ${data.agentName}.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.SITE_VISIT_CANCELED]: `Your scheduled site visit for ${data.requestId} - ${data.jobTitle} has been canceled. If you didn't request this, please contact support for assistance.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.ESTIMATE_AVAILABLE]: `Your estimate for ${data.requestId} - ${data.jobTitle} is ready. Review and approve it.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.WORK_SCHEDULED]: `Work for your request (${data.requestId} - ${data.jobTitle}) is scheduled on ${data.dateTime} with ${data.agentName}.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.WORK_RESCHEDULED]: `Your work for ${data.requestId} - ${data.jobTitle} has been rescheduled to ${data.newDateTime} with ${data.agentName}.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.WORK_CANCELED]: `Your scheduled work for ${data.requestId} - ${data.jobTitle} has been canceled. If you didn’t request this, please contact support for assistance.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.INVOICE_READY]: `Your invoice for ${data.requestId} - ${data.jobTitle} has been generated.`,
      [CONSTANTS.RESIDENT_MESSAGE_TYPE.NEW_ANNOUNCEMENT]: `${data.title}`
  };
  
  return messages[type] || "Hey there is updates for your request. Check it out.";
}

function createAgentMessage(type, data) {
  const messages = {
      [CONSTANTS.AGENT_MESSAGE_TYPE.SITE_VISIT_ASSIGNED]: `You have been assigned a site visit for ${data.requestId} - ${data.jobTitle} on ${data.dateTime}.`,
      [CONSTANTS.AGENT_MESSAGE_TYPE.SITE_VISIT_CANCELED]: `Your scheduled site visit for ${data.requestId} - ${data.jobTitle} has been canceled. No further action is required.`,
      [CONSTANTS.AGENT_MESSAGE_TYPE.SITE_VISIT_RESCHEDULED]: `The site visit for ${data.requestId} - ${data.jobTitle} has been rescheduled to ${data.newDateTime}.`,
      [CONSTANTS.AGENT_MESSAGE_TYPE.WORK_ASSIGNED]: `You have been assigned work for ${data.requestId} - ${data.jobTitle} on ${data.dateTime}.`,
      [CONSTANTS.AGENT_MESSAGE_TYPE.WORK_RESCHEDULED]: `The work for ${data.requestId} - ${data.jobTitle} has been rescheduled to ${data.newDateTime}.`,
      [CONSTANTS.AGENT_MESSAGE_TYPE.WORK_CANCELED]: `The work for ${data.requestId} - ${data.jobTitle} has been canceled. No further action is required.`
  };
  
  return messages[type] || "Hey there is work update. Check it out";
}


module.exports = { unifyDoorNumber, generateOTP, getSubStatusStringById, blastPushNotification, createResidentMessage, createAgentMessage }