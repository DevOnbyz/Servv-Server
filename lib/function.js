function unifyDoorNumber(doorNo) {
  return doorNo?.replace(/\s+/g, '').toUpperCase();
}
function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString()
}
module.exports = { unifyDoorNumber, generateOTP }