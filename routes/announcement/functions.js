const runQuery = require('../../db/runQuery')
const _ = require('lodash')
const moment = require('moment')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const momentTZ = require('moment-timezone')

const getApartmentListByResidentID = async (residentID) => {
  return (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentApartmentRelByResidentID(CONSTANTS.BUILDING_DATABASE), [residentID]))?.map((item) => item.apartment_id) ?? []
}

const getProjectIDByApartmentID = async (apartmentID) => {
  return (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getProjectByApartmentID(CONSTANTS.BUILDING_DATABASE), [apartmentID]))?.map((item) => item.project_id) ?? []
}

const getProjectNames = (projectList, projectNames) => {
  return projectNames?.filter((project) => projectList?.includes(project.id))?.map((project) => project.name)
}

const formatAnnouncements = (announcementList, projectList, isFiltered) => {
  const uniqueAnnouncements  = [...new Map(announcementList.map(item => [item.id, item])).values()]
  return uniqueAnnouncements 
    ?.map((announcement) => {
      const projectIDs = parseProjectIDs(announcement.project_id)
      const projectAssociated = getProjectNames(projectIDs, projectList)

      // Exclude items with empty projectAssociated when isFiltered is true
      if (isFiltered && _.isEmpty(projectAssociated)) {
        return null
      }

      return {
        ...announcement,
        project: projectAssociated,
        created_at: moment(announcement.created_at).format("DD-MM-YYYY"),
        expire_date: moment(announcement.expire_date).format("DD-MM-YYYY"),
        duration: moment(announcement.expire_date).startOf("day").diff(moment(announcement.created_at).startOf("day"), "days"),
        img_src: announcement.img_src || null,
        interest: announcement.interest === CONSTANTS.ANNOUNCEMENT_INTEREST.INTERESTED,
      }
    })
    .filter(Boolean)
}

function convertToUTC(date, timezone) {
// convert to UTC from local/user timezone
  const format = "YYYY-MM-DD HH:mm:ss z";
  const localDateTime = momentTZ.tz(date, format, timezone);

  if (!localDateTime.isValid())
    throw new Error("Invalid date format");

  const utcDateTime = localDateTime.utc();
  return utcDateTime.toISOString();
}

async function getProjectAssocaitedWithResident(residentID, projectList){
  const apartmentUnderResident = await getApartmentListByResidentID(residentID)
  const projectUnderResident = await getProjectIDByApartmentID(apartmentUnderResident)
  return projectList?.filter((project) => projectUnderResident?.includes(project.id))
}

function filterAnnouncementsByProjects(announcementList, projectAssociatedWithResident) {
  return announcementList.filter((announcement) => {
      const projectIDs = parseProjectIDs(announcement.project_id);
      return projectAssociatedWithResident.some((project) => projectIDs.includes(project.id));
  });
}

function parseProjectIDs(projectID) {
  if (Array.isArray(projectID)) return projectID;
  if (_.isEmpty(projectID)) return [];
  return JSON.parse(projectID).map((project) => parseInt(project));
}

function formatAndFilterAnnouncements(filteredAnnouncement, projectListUnderOrg) {
  const currentDate = moment().startOf('day');
  return formatAnnouncements(filteredAnnouncement, projectListUnderOrg, true).filter((announcement) => {
      return moment(announcement.expire_date, "DD-MM-YYYY").isSameOrAfter(currentDate);
  });
}


module.exports = {
  getApartmentListByResidentID,
  getProjectIDByApartmentID,
  getProjectNames,
  formatAnnouncements,
  convertToUTC,
  getProjectAssocaitedWithResident,
  filterAnnouncementsByProjects,
  formatAndFilterAnnouncements
}