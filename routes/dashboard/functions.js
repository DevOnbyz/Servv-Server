const formatDashboardData = (dashboardData) => {
    console.log(dashboardData);
    
    return {
        totalCounts: {
            serviceRequests: dashboardData.totalServiceRequests,
            residents: dashboardData.totalResidents,
            agents: dashboardData.totalAgents,
            revenue: dashboardData.totalRevenue
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
