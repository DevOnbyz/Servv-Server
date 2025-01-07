const CONSTANTS = require('../../lib/constants')

module.exports = {
    getDashboardData(database, orgId) {
        return `
        SELECT
            (SELECT COUNT(*) FROM ${database}.issue WHERE org_id = ${orgId}) as totalServiceRequests,
            (SELECT COUNT(*) FROM ${database}.resident WHERE org_id = ${orgId}) as totalResidents,
            (SELECT COUNT(*) FROM ${database}.agent WHERE org_id = ${orgId}) as totalAgents,
            (SELECT COALESCE(SUM(INV.total_charge), 0)
             FROM ${database}.invoice INV
             JOIN ${database}.issue I ON INV.issue_id = I.id
             WHERE I.org_id = ${orgId} AND INV.status = ${CONSTANTS.QUOTATION_STATUS.PAID} AND I.status = ${CONSTANTS.ISSUE_STATUS.CLOSED} AND I.sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID}) as totalRevenue,

            (SELECT COUNT(*) FROM ${database}.issue WHERE org_id = ${orgId} AND status = ${CONSTANTS.ISSUE_STATUS.OPEN}) as newRequests,
            (SELECT COUNT(*) FROM ${database}.issue WHERE org_id = ${orgId} AND status = ${CONSTANTS.ISSUE_STATUS.INPROGRESS}) as inProgressRequests,
            (SELECT COUNT(*) FROM ${database}.issue WHERE org_id = ${orgId} AND status = ${CONSTANTS.ISSUE_STATUS.ONHOLD}) as onHoldRequests,
            (SELECT COUNT(*) FROM ${database}.issue WHERE org_id = ${orgId} AND status = ${CONSTANTS.ISSUE_STATUS.CLOSED}) as completedRequests,

            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'serviceName', service.name,
                        'count', IFNULL(serviceUsage.count, 0)
                    )
                )
                FROM ${database}.service AS service
                LEFT JOIN (
                    SELECT I.service_type, COUNT(*) AS count
                    FROM ${database}.issue I
                    WHERE I.org_id = ${orgId}
                    GROUP BY I.service_type
                ) AS serviceUsage
                ON service.id = serviceUsage.service_type
            ) AS serviceUsage
        `;
    }
};
