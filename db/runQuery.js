const mainCluster=require("./index")
const getConnection=require("./getConnection")
const executeQuery = require("./executeQuery")

module.exports = async (domain, query, params) => await executeQuery(await getConnection(mainCluster, domain), query, params)