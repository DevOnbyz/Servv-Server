const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const Log = require('../../log')
const _ = require('lodash')
const queryBuilder = require('./query')
const { formatDashboardData } = require('./functions')

exports.getDashbordDataController = async (request, response) => {
    const orgID = request.orgID;

    try {
        const [dashBoardData] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getDashboardData(CONSTANTS.BUILDING_DATABASE,orgID))
        const formatedDashboardData = formatDashboardData(dashBoardData)

        return sendHTTPResponse.success(response, 'Dashboard fetched successfully',formatedDashboardData);
    } catch (error) {
        Log.error(`[Servv | OrganisationID:${orgID} | getDashbordDataController | Error in fetching Dashboard | Error: ${error.message}`);
        sendHTTPResponse.error(response, 'Error while fetching Dashboard', error);
    }
};