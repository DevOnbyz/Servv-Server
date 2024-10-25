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
    const groupedData = residentDetails?.reduce((acc, row) => {
      const { id, firstname, lastname, ph_num, email_id, projectName, doorNo, city, district, state, country, apartmentID, apartmentResidentRelID, projectID } = row
      const fullName = `${firstname} ${lastname}`.trim()
      let resident = acc.find((r) => r.phNum === ph_num)
      if (!resident) {
        resident = {
          id,
          name: fullName,
          phNum: ph_num,
          email: email_id,
          project: [],
        }
        acc.push(resident)
      }
      resident.project.push({
        apartmentID,
        apartmentResidentRelID,
        projectID,
        name: projectName,
        doorNo: doorNo,
        city: city,
        district: district,
        state: state,
        country: country,
      })

      return acc
    }, [])
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
    const apartments = request.body.apartments
    if (_.isEmpty(apartments)) return sendHTTPResponse.error(response, 'Please select project', null, 400)

    for (item of apartments) {
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const data = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveApratmentByProjectAndName(CONSTANTS.BUILDING_DATABASE), [projectID, doorNo])
      if (!_.isEmpty(data)) {
        const message = `Door number ${doorNo} already exists for the project`
        return sendHTTPResponse.error(response, message, null, 400)
      }
    }

    const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])
    const residentIdentityID = _.isEmpty(phNumDetails) ? (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResidentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum }]))?.insertId : phNumDetails[0]?.id

    if (!_.isEmpty(phNumDetails)) {
      // if a resident having same phone number exists in a same organisation then the admin can edit not add
      const residentOrgDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentByPhNumIDAndOrgID(CONSTANTS.BUILDING_DATABASE), [residentIdentityID, orgID])
      if (!_.isEmpty(residentOrgDetails)) return sendHTTPResponse.error(response, 'Resident with same phone number already exists', null, 400)
    }

    const residentDetails = {
      firstname,
      lastname,
      email_id: email,
      updated_by: userID,
      org_id: orgID,
      identity_id: residentIdentityID,
    }

    const residentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResident(CONSTANTS.BUILDING_DATABASE), [residentDetails]))?.insertId

    for (item of apartments) {
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const apartmentData = {
        project_id: projectID,
        name: doorNo,
        created_by: userID,
      }
      const apartmentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartment(CONSTANTS.BUILDING_DATABASE), [apartmentData]))?.insertId
      const residentApartmentRel = {
        resident_id: residentID,
        apartment_id: apartmentID,
        created_by: userID,
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

exports.editResidentController = async (request, response) => {
  const orgID = request.orgID
  const residentID = parseInt(request.params.id) //A resident can have multiple apartment. A resident will have a id under a organisation who can own multiple apartments
  const userID = request.userID
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const email = request.body.emailID
    const apartments = request.body.apartments
    const status = request.body.status
    const residentOwnedApartmentRelDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentApartmentRelByResidentID(CONSTANTS.BUILDING_DATABASE), [residentID])
    const ownedApartmentID = residentOwnedApartmentRelDetails?.map((item) => item.apartment_id)
    const residentOwnedApartmentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getApartmentsByIDs(CONSTANTS.BUILDING_DATABASE), [ownedApartmentID])
    const residentOwnedDoorNos = residentOwnedApartmentDetails?.map((item) => item.name)
    const residentOwnedProjectDetails = residentOwnedApartmentDetails?.map((item) => ({
      projectID: item.project_id,
      doorNo: item.name,
    }))

    for(item of apartments){
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const data = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveApratmentByProjectAndName(CONSTANTS.BUILDING_DATABASE), [projectID, doorNo])
      console.log({residentOwnedDoorNos, doorNo, aa: !_.includes(residentOwnedDoorNos, doorNo)})
      // if a resident owned 18A and he is changing it by 2A which is owned by another guy then error so he have make the existing 2A person null
      if(!_.isEmpty(data) && !_.includes(residentOwnedDoorNos, doorNo)) {
        const message = `Door number already exists for the project`
        return sendHTTPResponse.error(response, message, null, 400)
      }
    }

    // if (status !== undefined) {
    //   // changing status of resident table, apartment table and apartment_resident_rel table
    //   // Once it is done another one can use same apartment doorname for another resident.
    //   await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentApartmentRel(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRelID])
    //   await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateApartmentDetails(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRel?.apartment_id])
    //   await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentDetails(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRel?.apartment_id])
    //   Log.info(`[Servv | OrganisationID:${orgID}] | editResidentController | Resident status updated successfully`)
    //   return sendHTTPResponse.success(response, 'Resident status updated successfully')
    // }

    for (const item of apartments) {
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID

      const status = item?.status
      
      if (status === 'delete') {
        const residentApartmentRel = residentOwnedApartmentRelDetails.find((rel) => rel.apartment_id === item.apartmentID)
        console.log({ deleteDetails: residentApartmentRel })
        if (residentApartmentRel) {
          Log.info(`[Servv | OrganisationID:${orgID}] | editResidentController | Deleting resident from apartment  | ResidentID: ${residentID} | ApartmentID: ${item.apartmentID}`)
          await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.deleteApartmentRelByResidentID(CONSTANTS.BUILDING_DATABASE), [residentID, item.apartmentID])
          await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.deleteApartmentByApartmentID(CONSTANTS.BUILDING_DATABASE), [item.apartmentID])
        }
        continue
      }

      // Proceed with updates or creation
      const apartmentData = {
        project_id: projectID,
        name: doorNo,
        updated_by: userID,
      }

      if (status === 'new') {
        const apartmentID = (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartment(CONSTANTS.BUILDING_DATABASE), [apartmentData]))?.insertId
        const residentApartmentRel = {
          resident_id: residentID,
          apartment_id: apartmentID,
          created_by: userID,
        }
        Log.info(`[Servv | OrganisationID:${orgID}] | editResidentController | Adding resident in apartment | ResidentID: ${residentID} | ApartmentID: ${apartmentID}`)
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartmentResidentRel(CONSTANTS.BUILDING_DATABASE), [residentApartmentRel])
      } else if (status === 'update') {
        const residentApartmentRel = residentOwnedApartmentRelDetails.find((rel) => rel.apartment_id === item.apartmentID)
        if (residentApartmentRel) {
          Log.info(`[Servv | OrganisationID:${orgID}] | editResidentController | Updating resident in apartment | ResidentID: ${residentID} | ApartmentID: ${residentApartmentRel?.apartment_id} | apartmentData: ${JSON.stringify(apartmentData)}`)
          await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateApartmentDetails(CONSTANTS.BUILDING_DATABASE), [apartmentData, residentApartmentRel?.apartment_id])
        }
      }
    }

    const newResidentRecord = {
      firstname,
      lastname,
      email_id: email,
      updated_by: userID,
    }
    await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentDetails(CONSTANTS.BUILDING_DATABASE), [newResidentRecord, residentID])
    return sendHTTPResponse.success(response, 'Resident updated successfully')
  } catch (error) {
    Log.error(`[Servv | OrganisationID:${orgID}] | editServicesController | OrgainsationRelID:${residentID} | Error in updating service list`)
    return sendHTTPResponse.error(response, 'Error on updating service', error.message)
  }
}
