const libphonenumber = require('libphonenumber-js')

module.exports = (phNum, countryCode) => phNum ? (libphonenumber.parsePhoneNumberFromString(phNum.toString(), countryCode)?.number) ?? null : null