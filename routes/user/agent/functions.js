function maskPhoneNumber(phoneNumber, options = {}) {

    // Default parameters
    const config = {
        prefixLength: 3,
        suffixLength: 2,
        maskChar: '*',
        ...options
    };

    if (!phoneNumber) return phoneNumber;

    const phoneLength = phoneNumber.length;

    const prefix = phoneNumber.substring(0, config.prefixLength);
    const suffix = phoneNumber.substring(phoneLength - config.suffixLength);
    const middleLength = phoneLength - config.prefixLength - config.suffixLength;
    const maskedMiddle = config.maskChar.repeat(middleLength);

    return prefix + maskedMiddle + suffix;
}

module.exports = { maskPhoneNumber };