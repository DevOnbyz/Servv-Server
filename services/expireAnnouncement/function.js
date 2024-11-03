const Log = require('../../log')
const { getOrganisations } = require('../../db/query')
const runQuery = require('../../db/runQuery')
const constants = require('../../lib/constants')
const queryBuilder = require('./query')
const _ = require('lodash')


exports.expireAnnouncement = async () => {
  const orgList = await runQuery(constants.BUILDING_DATABASE, getOrganisations(constants.BUILDING_DATABASE), [])
  Log.info(`[ExpireAnnouncement] | expireAnnouncement | Organisations List: ${orgList?.map((item) => item.name)?.join(', ')}`)
  for (const org of orgList) {
    const expireAnnouncementList = await runQuery(constants.BUILDING_DATABASE, queryBuilder.getAvtiveAnnouncements(constants.BUILDING_DATABASE), [org.id])

    if (_.isEmpty(expireAnnouncementList))
      continue

    const expireAnnouncementID = expireAnnouncementList?.map((item) => item.id)
    Log.info(`[${org.name}] | expireAnnouncement | Expired Announcement ID: ${expireAnnouncementID}`)
    await runQuery(constants.BUILDING_DATABASE, queryBuilder.updateAnnouncementStatusByIDs(constants.BUILDING_DATABASE), [constants.ANNOUNCEMENT_STATUS.EXPIRED, expireAnnouncementID])
  }
}