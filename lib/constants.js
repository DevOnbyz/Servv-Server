module.exports = {
  BUILDING_DATABASE : 'servv_residence',
  SERVV_USER_TYPE_STRING :{
    ADMIN: 'admin',
    AGENT: 'agent',
    CUSTOMER : 'customer'
  },
  SERVV_USER_TYPE_NUM:{
    ADMIN: 0,
    AGENT: 1,
    CUSTOMER : 2
  },
  ACCESS_TOKEN_EXPIRY: '3h',
  REFRESH_TOKEN_EXPIRY: '7d',

  SERVICE_INTERVAL:{
    EXPIRE_ANNOUNCEMENT : '86400000' //24 hr
  },

  ANNOUNCEMENT_STATUS : {
    ACTIVE: 1,
    INACTIVE: 0,
    EXPIRED: 2
  }
}