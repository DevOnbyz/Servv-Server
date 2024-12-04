const CONSTANTS = require('./constants')
const serviceAccount = require('../firebase/adminConfig.json')
const admin = require("firebase-admin")

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

function blastPushNotification(FCMToken, token, body, image = null) {

  firebase.messaging().send({
    notification: {
      title: body,
    },
    android: {
      notification: {
        imageUrl: image
      }
    },
    token: FCMToken
  })
}


module.exports = { unifyDoorNumber, generateOTP, getSubStatusStringById, blastPushNotification }