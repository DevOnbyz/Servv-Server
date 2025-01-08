const formatDashboardData = (dashboardData) => {
    return {
        totalCounts: {
            serviceRequests: dashboardData.totalServiceRequests,
            residents: dashboardData.totalResidents,
            agents: dashboardData.totalAgents,
            revenue: dashboardData.totalRevenue
        },
        issueEventStatus: {
            SITE_VISIT_ASSIGNED: dashboardData.siteVisitAssigned,
            SITE_VISIT_COMPLETED: dashboardData.siteVisitCompleted,
            SITE_VISIT_CANCELLED: dashboardData.siteVisitCancelled,
            ESTIMATE_DRAFT: dashboardData.estimateDraft,
            ESTIMATE_SENT: dashboardData.estimateSent,
            ESTIMATE_APPROVED: dashboardData.estimateApproved,
            ESTIMATE_REJECTED: dashboardData.estimateRejected,
            WORK_ASSIGNED: dashboardData.workAssigned,
            WORK_COMPLETED: dashboardData.workCompleted,
            WORK_CANCELLED: dashboardData.workCancelled,
            INVOICE_DRAFTED: dashboardData.invoiceDraft,
            INVOICE_SENT: dashboardData.invoiceSent,
        },
        serviceRequestStatus: {
            new: dashboardData.newRequests,
            inProgress: dashboardData.inProgressRequests,
            onHold: dashboardData.onHoldRequests,
            completed: dashboardData.completedRequests
        },
        serviceUsage: JSON.parse(dashboardData.serviceUsage)
    }
}

module.exports = {
    formatDashboardData
}
