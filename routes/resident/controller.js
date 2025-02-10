const sendHTTPResponse = require('../../lib/sendHTTPResponse')
const runQuery = require('../../db/runQuery')
const CONSTANTS = require('../../lib/constants')
const queryBuilder = require('./query')
const Log = require('../../log')
const _ = require('lodash')
const runQueryOne = require('../../db/runQueryOne')
const { unifyDoorNumber } = require('../../lib/function')
const { getAllProjectsByOrgID, getAllApartmentsUnderProject, getResidentByIDs } = require('../../db/query')
const { formatPaymentHistory, validateKeys, validateProjectNames, validateDoorNoAndAttachProjectID, validateResidentPhNum, addAndAttachResidentID } = require('./functions')
const neatCSV = require('neat-csv')

exports.getResidentController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  try {
    const residentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentDataUnderOrg(CONSTANTS.BUILDING_DATABASE), [orgID])
    const groupedData = residentDetails?.reduce((acc, row) => {
      const { id, firstname, lastname, ph_num, email_id, projectName, doorNo, city, district, state, country, apartmentID, apartmentResidentRelID, projectID } = row
      const fullName = `${firstname} ${lastname ?? ""}`.trim()
      let resident = acc.find((r) => r.phNum === ph_num)
      if (!resident) {
        resident = {
          id,
          firstname,
          lastname,
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
    Log.error(`[${domain} | OrganisationID:${orgID}] | getResidentController | Error in fetching resident list | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching resident list', error.message)
  }
}


exports.getResidentByIDController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const residentID = request.params.id
  try {
    const residentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentDataByID(CONSTANTS.BUILDING_DATABASE), [orgID, residentID])
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
    Log.error(`[${domain} | OrganisationID:${orgID}] | getResidentController | Error in fetching resident list | Error: ${error.message}`)
    sendHTTPResponse.error(response, 'Error while fetching resident list', error.message)
  }
}

exports.addResidentController = async (request, response) => {
  const orgID = request.orgID
  const userID = request.userID
  const domain = request.domain
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
        const projectName = data[0].project_name;
        const message = `Door number ${doorNo} already exists for the project ${projectName}`
        return sendHTTPResponse.error(response, message, null, 400)
      }
    }

    const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])
    const residentIdentityID = _.isEmpty(phNumDetails) ? (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResidentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum, created_by: userID }]))?.insertId : phNumDetails[0]?.id

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
    Log.info(`[${domain} | OrganisationID:${orgID}] | addResidentController | Resident added successfully`)
    return sendHTTPResponse.success(response, 'Resident added successfully', {})
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addResidentController | Error on adding resident | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on adding resident', error.message)
  }
}

exports.addResidentBulkController = async (request, response) => {
  const orgID = request.orgID
  const userID = request.userID
  const domain = request.domain
  try {
    if (request.file.mimetype != 'text/csv')
      return sendHTTPResponse.error(response, 'Resident details file should be in CSV format')

    const csvFile = request.file.buffer.toString('utf8')
    const completeResidentDetails = await neatCSV(csvFile)

    Log.info(`[${domain} | OrganisationID:${orgID}] | addResidentBulkController | ${JSON.stringify(completeResidentDetails)}`)

    if (_.isEmpty(completeResidentDetails))
      return sendHTTPResponse.error(response, 'Resident details file should not be empty', null, 400)

    // Validations starts
    validateKeys(completeResidentDetails[0])

    const projectNames = completeResidentDetails.map((item) => item.projectName)
    const distinctProjectNames = [...new Set(projectNames)]

    const projectsUnderOrg = await runQuery(CONSTANTS.BUILDING_DATABASE, getAllProjectsByOrgID(CONSTANTS.BUILDING_DATABASE), [orgID])
    await validateProjectNames(orgID, distinctProjectNames, projectsUnderOrg)

    const projectIDNameList = projectsUnderOrg.map((project) => ({ id: project.id, name: project.name?.toLowerCase() }))
    await validateDoorNoAndAttachProjectID(orgID, completeResidentDetails, projectIDNameList)

    validateResidentPhNum(completeResidentDetails)
    // Validations ends

    await addAndAttachResidentID(orgID, userID, completeResidentDetails)

    const newResidentList = completeResidentDetails?.filter((item) => item.residentID === null)
    const existingResidentList = completeResidentDetails?.filter((item) => item.residentID !== null)

    if (_.isEmpty(newResidentList) && !_.isEmpty(existingResidentList)) {
      Log.info(`[${domain} | OrganisationID:${orgID}] | addResidentController | Residents already exist for the selected projects. To make changes, please edit them in settings.`)
      return sendHTTPResponse.error(response, 'Residents already exist for the selected projects. To make changes, please edit them in settings.', null, 400)
    }

    for (item of newResidentList) {
      const residentDetails = {
        firstname: item?.residentName,
        lastname: null,
        identity_id: item?.residentIdentityID,
        org_id: orgID,
        created_by: userID
      }
      const residentOrgDetails = await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentByPhNumIDAndOrgID(CONSTANTS.BUILDING_DATABASE), [item?.residentIdentityID, orgID])
      const residentID = !_.isEmpty(residentOrgDetails) ? residentOrgDetails.id : (await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addResident(CONSTANTS.BUILDING_DATABASE), [residentDetails]))?.insertId
      item.residentID = residentID
      const doorNo = unifyDoorNumber(item?.doorNumber)
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

    const existingResidentNames = existingResidentList.map((item) => item.residentName).join(', ')
    Log.info(`[${domain} | OrganisationID:${orgID}] | addResidentBulkController | Resident added successfully. But some residents already exists in the system : ${existingResidentNames}`)
    return sendHTTPResponse.success(response, 'Resident added successfully', completeResidentDetails)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | addResidentBulkController | Error on adding resident bulk | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on adding resident in bulk', error.message)
  }
}

exports.editResidentController = async (request, response) => {
  const orgID = request.orgID
  const residentID = parseInt(request.params.id) //A resident can have multiple apartment. A resident will have a id under a organisation who can own multiple apartments
  const userID = request.userID
  const domain = request.domain
  try {
    const firstname = request.body.firstname
    const lastname = request.body.lastname
    const email = request.body.emailID
    const apartments = request.body.apartments
    const status = request.body.status
    const phNum = request.body.phNum
    const residentOwnedApartmentRelDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentApartmentRelByResidentID(CONSTANTS.BUILDING_DATABASE), [residentID])
    const ownedApartmentID = residentOwnedApartmentRelDetails?.map((item) => item.apartment_id)
    const residentOwnedApartmentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getApartmentsByIDs(CONSTANTS.BUILDING_DATABASE), [ownedApartmentID])
    const residentOwnedDoorNos = residentOwnedApartmentDetails?.map((item) => item.name)
    const residentOwnedProjectDetails = residentOwnedApartmentDetails?.map((item) => ({
      projectID: item.project_id,
      doorNo: item.name,
    }))

    const currentResidentDetails = await runQueryOne(
      CONSTANTS.BUILDING_DATABASE,
      queryBuilder.getResidentByID(CONSTANTS.BUILDING_DATABASE),
      [residentID]
    )
    const currentIdentityID = currentResidentDetails?.identity_id

    const phNumDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentIdentityByPhNum(CONSTANTS.BUILDING_DATABASE), [phNum])

    if (!_.isEmpty(phNumDetails) && phNumDetails[0]?.id !== currentIdentityID)
      return sendHTTPResponse.error(response, 'Resident with same phone number already exists', null, 400)

    if (_.isEmpty(phNumDetails))
      await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentIdentity(CONSTANTS.BUILDING_DATABASE), [{ ph_num: phNum, created_by: userID },currentIdentityID])

    for (item of apartments) {
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID
      const data = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getActiveApratmentByProjectAndName(CONSTANTS.BUILDING_DATABASE), [projectID, doorNo])
      // if a resident owned 18A and he is changing it by 2A which is owned by another guy then error so he have make the existing 2A person null
      if (!_.isEmpty(data) && !_.includes(residentOwnedDoorNos, doorNo)) {
        const projectName = data[0].project_name;
        const message = `Door number already exists for the project ${projectName}`
        return sendHTTPResponse.error(response, message, null, 400)
      }
    }

    // if (status !== undefined) {
    //   // changing status of resident table, apartment table and apartment_resident_rel table
    //   // Once it is done another one can use same apartment doorname for another resident.
    //   await runQueryOne(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentApartmentRel(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRelID])
    //   await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateApartmentDetails(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRel?.apartment_id])
    //   await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.updateResidentDetails(CONSTANTS.BUILDING_DATABASE), [{status}, residentApartmentRel?.apartment_id])
    //   Log.info(`[${domain} | OrganisationID:${orgID}] | editResidentController | Resident status updated successfully`)
    //   return sendHTTPResponse.success(response, 'Resident status updated successfully')
    // }

    for (const item of apartments) {
      const doorNo = unifyDoorNumber(item?.doorNo)
      const projectID = item?.projectID

      const status = item?.status

      if (status === 'delete') {
        const residentApartmentRel = residentOwnedApartmentRelDetails.find((rel) => rel.apartment_id === item.apartmentID)
        if (residentApartmentRel) {
          Log.info(`[${domain} | OrganisationID:${orgID}] | editResidentController | Deleting resident from apartment  | ResidentID: ${residentID} | ApartmentID: ${item.apartmentID}`)
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
        Log.info(`[${domain} | OrganisationID:${orgID}] | editResidentController | Adding resident in apartment | ResidentID: ${residentID} | ApartmentID: ${apartmentID}`)
        await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addApartmentResidentRel(CONSTANTS.BUILDING_DATABASE), [residentApartmentRel])
      } else if (status === 'update') {
        const residentApartmentRel = residentOwnedApartmentRelDetails.find((rel) => rel.apartment_id === item.apartmentID)
        if (residentApartmentRel) {
          Log.info(`[${domain} | OrganisationID:${orgID}] | editResidentController | Updating resident in apartment | ResidentID: ${residentID} | ApartmentID: ${residentApartmentRel?.apartment_id} | apartmentData: ${JSON.stringify(apartmentData)}`)
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
    Log.error(`[${domain} | OrganisationID:${orgID}] | editResidentController | OrgainsationRelID:${residentID} | Error in updating resident list | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on updating resident', error.message)
  }
}

exports.getResidentByProjectController = async (request, response) => {
  const orgID = request.orgID
  const domain = request.domain
  const projectID = request.params.projectID
  try {
    const apartmentsUnderProject = await runQuery(CONSTANTS.BUILDING_DATABASE, getAllApartmentsUnderProject(CONSTANTS.BUILDING_DATABASE), [projectID])

    const apartmentIDAndDoorNoList = apartmentsUnderProject?.map((apartment) => ({
      apartment_id: apartment?.id,
      door_no: apartment?.name,
    }))

    const apartmentIDList = apartmentsUnderProject?.map((apartment) => apartment?.id)
    const residentApartmentRelDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getAllResidentApartmentRelDetails(CONSTANTS.BUILDING_DATABASE), [apartmentIDList])
    const residentIDs = residentApartmentRelDetails?.map((relDetails) => relDetails?.resident_id)
    const residentDetails = await runQuery(CONSTANTS.BUILDING_DATABASE, getResidentByIDs(CONSTANTS.BUILDING_DATABASE), [residentIDs])

    if (_.isEmpty(apartmentIDList)) return sendHTTPResponse.success(response, [])

    const residentApartmentMap = residentApartmentRelDetails?.reduce((acc, relDetails) => {
      const apartment = apartmentIDAndDoorNoList?.find((apartment) => apartment.apartment_id === relDetails.apartment_id)
      if (apartment) {
        if (!acc[relDetails.resident_id]) {
          acc[relDetails.resident_id] = []
        }
        acc[relDetails.resident_id].push(apartment)
      }
      return acc
    }, {})

    const residentDetailsWithApartments = residentDetails.map((resident) => ({
      ...resident,
      apartments: residentApartmentMap[resident.id] || [],
    }))

    return sendHTTPResponse.success(response, 'Resident list fetched successfully', residentDetailsWithApartments)
  } catch (error) {
    Log.error(`[${domain} | OrganisationID:${orgID}] | getResidentByProjectController | ProjectID:${projectID} | Error in getting resident list | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on getting resident list', error.message)
  }
}

exports.addSupportController = async (request, response) => {
  try {
    const title = request.body.title
    const description = request.body.description
    const residentID = request.params.id ? parseInt(request.params.id) : null

    await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.addSupport(CONSTANTS.BUILDING_DATABASE), [{ title, description, resident_id: residentID }])

    Log.info(`[ residentID:${residentID}] | addSupportController | Support added successfully`)
    return sendHTTPResponse.success(response, 'Support added successfully', {})
  } catch (error) {
    Log.error(`[ residentID:${residentID}] | addSupportController | Error on adding Support | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on adding Support', error.message)
  }
}
exports.getResidentPaymentHistoryController = async (request, response) => {
  const residentID = parseInt(request.params.id)

  try {
    const [residentDetails] = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getResidentByIDUnderOrg(CONSTANTS.BUILDING_DATABASE), [residentID])

    if (_.isEmpty(residentDetails)) return sendHTTPResponse.success(response, [])
    if (_.isEmpty(residentDetails.razorpay_route_account_id)) return sendHTTPResponse.error(response, 'Razorpay route account not found for the organisation - org_id:' + residentDetails.org_id, null, 400)

    const razorpayPaymentHistory = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getRazorpayPaymentByResidentID(CONSTANTS.BUILDING_DATABASE), [residentDetails.org_id, residentID])
    const manualPaymentHistory = await runQuery(CONSTANTS.BUILDING_DATABASE, queryBuilder.getManualPaymentByResidentID(CONSTANTS.BUILDING_DATABASE), [residentDetails.org_id, residentID])

    residentDetails.paymentHistory = formatPaymentHistory([...razorpayPaymentHistory, ...manualPaymentHistory])

    return sendHTTPResponse.success(response, 'Resident List fetched successfully', residentDetails)
  } catch (error) {
    Log.error(`[ residentID:${residentID}] | addSupportController | Error on adding Support | Error: ${error.message}`)
    return sendHTTPResponse.error(response, 'Error on adding Support', error.message)
  }
}