const CONSTANTS = require('./constants')

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

module.exports = { unifyDoorNumber, generateOTP, getSubStatusStringById }