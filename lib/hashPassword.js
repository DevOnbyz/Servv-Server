const bcrypt = require('bcrypt')

const saltRounds = 10

module.exports = async (password) => {
    try {
        const hash = await bcrypt.hash(password, saltRounds)
        return hash
    } catch (err) {
        throw err
    }
}

// await bcrypt.compare(password, hash.password)