function unifyDoorNumber(doorNo) {
  return doorNo?.replace(/\s+/g, '').toUpperCase();
}

module.exports = { unifyDoorNumber }