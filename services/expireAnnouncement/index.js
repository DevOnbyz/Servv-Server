const { SERVICE_INTERVAL } = require("../../lib/constants")
const { expireAnnouncement } = require("./function")

const main = ()=>{
  expireAnnouncement()
  setInterval(expireAnnouncement, SERVICE_INTERVAL.EXPIRE_ANNOUNCEMENT)
}
main()