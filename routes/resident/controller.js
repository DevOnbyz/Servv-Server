const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const { unifyDoorNumber } = require('../../lib/function')
const { getAllProjectsByOrgID } = require('../../db/query')

exports.getResidentController = async (request, response) => {
  const orgID = request.orgID
  try {
    const residentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentDataUnderOrg(CONSTANTS.BUILDING_DATABASE), [orgID])
    const groupedData = residentDetails.reduce((acc, row) => {
      const { firstname, lastname, ph_num, email_id, projectName, doorNo, city, district, state, country } = row;
      const fullName = `${firstname} ${lastname}`.trim();
      let resident = acc.find((r) => r.phNum === ph_num);
      if (!resident) {
        resident = {
          name: fullName,
          phNum: ph_num,
          email: email_id,
          project: [],
        };
        acc.push(resident);
      }
      resident.project.push({
        name: projectName,
        doorNo: doorNo,
        city: city,
        district: district,
        state: state,
        country: country,
      });
    
      return acc;
    }, []);
    return sendHTTPResponse.success(response, 'Resident List fetched successfully', groupedData)
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | getResidentController | Error in fetching service list`)
    sendHTTPResponse.error(response, 'Error while fetching service list', error)
  }
}
exports.addResidentController = async (request, response) => {
  const orgID = request.orgID
  const userID = request.userID
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const email = request.body.emailID
    const phNum = request.body.phNum
    const project = request.body.project
    if(_.isEmpty(project))
      return sendHTTPResponse.error(response, 'Please select project', null, 400)

    for(item of project){
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const data = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getApratmentByProjectAndName(CONSTANTS.BUILDING_DATABASE), [projectID, doorNo])
      if(!_.isEmpty(data)) {
        const message = `Door number ${doorNo} already exists for the project`
        return sendHTTPResponse.error(response, message, null, 400)
      }
    }

    const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])
    const residentIdentityID = _.isEmpty(phNumDetails) ? (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResidentIdentity(CONSTANTS.BUILDING_DATABASE), [{ph_num: phNum}]))?.insertId : phNumDetails[0]?.id

    const residentDetails = {
      firstname,
      lastname,
      email_id: email,
      updated_by:userID,
      identity_id: residentIdentityID
    }

    const residentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResident(CONSTANTS.BUILDING_DATABASE), [residentDetails]))?.insertId

    for(item of project){
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const apartmentData = {
        project_id: projectID,
        name: doorNo,
        created_by: userID
      }
      const apartmentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartment(CONSTANTS.BUILDING_DATABASE), [apartmentData]))?.insertId
      const residentApartmentRel = {
        resident_id: residentID,
        apartment_id: apartmentID,
        created_by: userID
      }
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartmentResidentRel(CONSTANTS.BUILDING_DATABASE), [residentApartmentRel])
    }
    Log.info(`[Servv | OrganisationID:${orgID}] | addResidentController | Resident added successfully`)
    return sendHTTPResponse.success(response, 'Resident added successfully', {})
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | addResidentController | Error on adding service | ${error}`)
    return sendHTTPResponse.error(response, 'Error on adding service', error)
  }
}

exports.editServicesController = async (request, response) => {
  const orgID = request.orgID
  const serviceOrgRelID = parseInt(request.params.id)
  try {
    const description = request.body.description
    const name = request.body.name
    const status = request.body.status
    const type = request.body.type

    const updateDetails = {}
    if (status !== undefined) {
      updateDetails.status = status
      const projectList = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
      if (!_.isEmpty(projectList)) {
        for (project of projectList) {
          const projectID = project?.id
          const projectRelData = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getProjectServiceRelData(CONSTANTS.BUILDING_DATABASE), [projectID, type])
          if (!_.isEmpty(projectRelData)) {
            // if that project already has that service then update the project status
            Log.info(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationServiceRelID:${serviceOrgRelID} | Updating Project status`)
            await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateProjectServiceRel(CONSTANTS.BUILDING_DATABASE), [{ status }, projectRelData.id])
          }
        }
      }
    } else {
      updateDetails.description = description
      updateDetails.service_type = type
      updateDetails.name = name
    }

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateServiceOrgRel(CONSTANTS.BUILDING_DATABASE), [updateDetails, serviceOrgRelID])
    return sendHTTPResponse.success(response, 'Service updated successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationRelID:${serviceOrgRelID} | Error in updating service list`)
    return sendHTTPResponse.error(response, 'Error on updating service', error.message)
  }
}

