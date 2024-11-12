module.exports = {
  BUILDING_DATABASE: 'servv_residence',
  SERVV_USER_TYPE_STRING: {
    ADMIN: 'admin',
    AGENT: 'agent',
    CUSTOMER: 'customer',
  },
  SERVV_USER_TYPE_NUM: {
    ADMIN: 0,
    AGENT: 1,
    CUSTOMER: 2,
  },
  ACCESS_TOKEN_EXPIRY: '3h',
  REFRESH_TOKEN_EXPIRY: '7d',

  SERVICE_INTERVAL: {
    EXPIRE_ANNOUNCEMENT: '86400000', //24 hr
  },

  ISSUE_STATUS: {
    OPEN: 0,
    INPROGRESS: 1,
    CLOSED: 2,
    ONHOLD: 3,
  },
  ISSUE_STATUS_STRING: {
    OPEN: 'OPEN',
    INPROGRESS: 'INPROGRESS',
    CLOSED: 'CLOSED',
    ONHOLD: 'ONHOLD',
  },
  ISSUE_SUB_STATUS_STRING: {
    CREATED: 'created',
    AGENT_ASSIGNED: 'agent_assigned',
    SITE_VISIT_COMPLETED: 'site_visit_completed',
    REVISIT_REQUIRED: 'revisit_required',
    ESTIMATE_GENERATED: 'estimate_generated',
    ESTIMATE_APPROVED: 'estimate_approved',
    ESTIMATE_REJECTED: 'estimate_rejected',
    WORK_ASSIGNED: 'work_assigned',
    WORK_COMPLETED: 'work_completed',
    RE_WORK_REQUIRED: 're_work_required',
    INVOICE_GENERATED: 'invoice_generated',
    PAID: 'paid',
    CLOSED: 'closed',
    ONHOLD: 'onhold',
  },
  ISSUE_SUB_STATUS_NUM: {
    CREATED: 0,
    AGENT_ASSIGNED: 1,
    SITE_VISIT_COMPLETED: 2,
    REVISIT_REQUIRED: 3,
    ESTIMATE_GENERATED: 4,
    ESTIMATE_APPROVED: 5,
    ESTIMATE_REJECTED: 6,
    WORK_ASSIGNED: 7,
    WORK_COMPLETED: 8,
    RE_WORK_REQUIRED: 9,
    INVOICE_GENERATED: 10,
    PAID: 11,
    ON_HOLD: 12,
    CLOSED: 13,
  },

  ANNOUNCEMENT_STATUS: {
    ACTIVE: 1,
    INACTIVE: 0,
    EXPIRED: 2,
  },

  AGENT_ASSIGNMENT_STATUS: {
    PENDING: 0,
    COMPLETED: 1
  },
};
