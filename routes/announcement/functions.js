const runQuery = require('../../db/runQuery')
const _ = require('lodash')
const moment = require('moment')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')

const getApartmentListByResidentID = async (residentID) => {
  return (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentApartmentRelByResidentID(CONSTANTS.BUILDING_DATABASE), [residentID]))?.map((item) => item.apartment_id) ?? []
}

const getProjectIDByApartmentID = async (residentID) => {
  return (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getProjectByApartmentID(CONSTANTS.BUILDING_DATABASE), [residentID]))?.map((item) => item.project_id) ?? []
}

const getProjectNames = (projectList, projectNames) => {
  return projectNames?.filter((project) => projectList?.includes(project.id))?.map((project) => project.name)
}

const formatAnnouncements = (announcementList, projectList, isFiltered) => {
  return announcementList
    ?.map((announcement) => {
      const projectIDs = !_.isEmpty(announcement.project_id) ? JSON.parse(announcement.project_id)?.map((project) => parseInt(project)) : []
      const projectAssociated = getProjectNames(projectIDs, projectList)

      // Exclude items with empty projectAssociated when isFiltered is true
      if (isFiltered && _.isEmpty(projectAssociated)) {
        return null
      }

      console.log({ projectAssociated })
      return {
        ...announcement,
        project: projectAssociated,
        created_at: moment(announcement.created_at).format("DD-MM-YYYY"),
        expire_date: moment(announcement.expire_date).format("DD-MM-YYYY"),
        duration: moment(announcement.expire_date).startOf("day").diff(moment(announcement.created_at).startOf("day"), "days"),
        img_src: announcement.img_src || null,
        response: [],
      }
    })
    .filter(Boolean)
}

module.exports = {
  getApartmentListByResidentID,
  getProjectIDByApartmentID,
  getProjectNames,
  formatAnnouncements,
}