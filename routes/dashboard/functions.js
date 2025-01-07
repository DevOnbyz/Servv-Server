const formatDashboardData = (dashboardData) => {
    return {
        totalCounts: {
            serviceRequests: dashboardData.totalServiceRequests,
            residents: dashboardData.totalResidents,
            agents: dashboardData.totalAgents,
            revenue: dashboardData.totalRevenue
        },
        issueEventStatus: {
            open: dashboardData.openIssues,
            siteVisitAssigned: dashboardData.siteVisitAssigned,
            siteVisitCompleted: dashboardData.siteVisitCompleted,
            siteVisitCancelled: dashboardData.siteVisitCancelled,
            estimateDraft: dashboardData.estimateDraft,
            estimateSent: dashboardData.estimateSent,
            estimateApproved: dashboardData.estimateApproved,
            estimateRejected: dashboardData.estimateRejected,
            workAssigned: dashboardData.workAssigned,
            workCompleted: dashboardData.workCompleted,
            workCancelled: dashboardData.workCancelled,
            invoiceDraft: dashboardData.invoiceDraft,
            invoiceSent: dashboardData.invoiceSent,
            paid: dashboardData.paid,
            closed: dashboardData.closed,
            onhold: dashboardData.onhold
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
