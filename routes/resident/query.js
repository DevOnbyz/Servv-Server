const CONSTANTS = require("../../lib/constants");
const { PAYMENT_STATUS } = require("../../lib/constants");

module.exports = {
  addResident(database) {
    return `INSERT INTO ${database}.resident SET ?`;
  },
  getResidentByPhNumIDAndOrgID(database) {
    return `SELECT * FROM ${database}.resident WHERE ph_num  = ? AND org_id = ?`;
  },
  getResidentIdentityByPhNum(database) {
    return `SELECT * FROM ${database}.resident where ph_num = ?`
  },
  getResidentByPhNumAndOrg(database) {
    return `SELECT * FROM ${database}.resident WHERE ph_num = ? AND org_id = ?`
  },
  addResidentIdentity(database) {
    return `INSERT INTO ${database}.resident_identity SET ?`
  },
  updateResidentIdentity(database) {
    return `UPDATE ${database}.resident_identity SET ? WHERE id = ?`
  },
  addApartment(database) {
    return `INSERT INTO ${database}.apartment SET ?`
  },
  getApratmentByProjectAndName(database) {
    return `SELECT * FROM ${database}.apartment WHERE project_id = ? AND name = ?`
  },
  addApartmentResidentRel(database) {
    return `INSERT INTO ${database}.apartment_resident_rel SET ?`
  },
  getActiveApratmentByProjectAndName(database) {
    return `
    SELECT
    a.*,
    p.name as project_name
FROM
    ${database}.apartment a
JOIN
    ${database}.project p ON a.project_id = p.id
WHERE
    a.project_id = ? 
AND
    a.name = ?
AND
    a.status = 1`
  },
  getResidentDataUnderOrg(database) {
    return `
    SELECT
    r.id,
    arr.id AS apartmentResidentRelID,
    r.ph_num,            
    r.email_id,
    r.firstname,
    r.lastname,
    a.id AS apartmentID,
    p.id AS projectID,
    a.name AS doorNo,
    a.handover_date AS handoverDate,
    p.name AS projectName,
    p.city AS city, 
    p.district AS district, 
    p.state AS state, 
    p.country AS country
FROM 
    ${database}.resident r
JOIN 
    ${database}.apartment_resident_rel arr ON r.id = arr.resident_id
JOIN 
    ${database}.apartment a ON arr.apartment_id = a.id
JOIN 
    ${database}.project p ON a.project_id = p.id
WHERE 
    p.org_id = ? AND arr.status = 1 ORDER BY r.created_at DESC;
    `
  },
  getResidentDataByID(database) {
    return `
    SELECT
    r.id,
    arr.id AS apartmentResidentRelID,
    r.ph_num,            
    r.email_id,
    r.firstname,
    r.lastname,
    a.id AS apartmentID,
    p.id AS projectID,
    a.name AS doorNo,
    a.handover_date AS handoverDate,
    p.name AS projectName,
    p.city AS city, 
    p.district AS district, 
    p.state AS state, 
    p.country AS country
FROM 
    ${database}.resident r
JOIN 
    ${database}.apartment_resident_rel arr ON r.id = arr.resident_id
JOIN 
    ${database}.apartment a ON arr.apartment_id = a.id
JOIN 
    ${database}.project p ON a.project_id = p.id
WHERE 
    p.org_id = ? AND arr.status = 1 AND r.id = ?;
    `
  },
  getResidentApartmentRelByID(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel WHERE id = ?`
  },
  getApartmentByID(database) {
    return `SELECT * FROM ${database}.apartment WHERE id = ?`
  },
  getResidentByID(database) {
    return `SELECT * FROM ${database}.resident WHERE id = ?`
  },
  getResidentByIDUnderOrg(database) {
    return `
      SELECT 
        R.id, R.org_id,
        O.id AS organisation_id, O.razorpay_route_account_id
      FROM ${database}.resident R
      INNER JOIN ${database}.organisation O
      ON R.org_id = O.id
      WHERE R.id = ? AND O.id = ?;
    `;
},

  updateApartmentDetails(database) {
    return `UPDATE ${database}.apartment SET ? WHERE id = ?`
  },
  updateResidentDetails(database) {
    return `UPDATE ${database}.resident SET ? WHERE id = ?`
  },
  updateResidentApartmentRel(database) {
    return `UPDATE ${database}.apartment_resident_rel SET ? WHERE id = ?`
  },
  getResidentApartmentRelByResidentID(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel WHERE resident_id = ?`
  },
  getApartmentsByIDs(database) {
    return `SELECT * FROM ${database}.apartment WHERE id in (?)`
  },
  deleteApartmentRelByResidentID(database) {
    return `DELETE FROM ${database}.apartment_resident_rel WHERE resident_id = ? and apartment_id = ?`
  },
  deleteApartmentByApartmentID(database) {
    return `DELETE FROM ${database}.apartment WHERE id = ?`
  },
  getAllResidentApartmentRelDetails(database) {
    return `SELECT * FROM ${database}.apartment_resident_rel where apartment_id in (?)`
  },
  addSupport: (database) => {
    return `INSERT INTO ${database}.support SET ?`
  },
  getRazorpayPaymentByResidentID: (database) => {
    return `
    SELECT DISTINCT p.total_amount, p.created_at as event_time, o.issue_id, s.name as serviceName
    FROM ${database}.payment p
    JOIN ${database}.order o ON p.order_id = o.id 
    JOIN ${database}.issue i ON o.issue_id = i.id
    JOIN ${database}.service s ON i.service_type = s.id
    WHERE p.org_id = ? 
    AND i.resident_id = ?
    GROUP BY p.id;`
  },

  getManualPaymentByResidentID: (database) => {
    return `
    SELECT DISTINCT i.total_charge as total_amount, i.issue_id,s.name AS serviceName,
    (SELECT MAX(event_time) FROM ${database}.issue_event WHERE issue_id = iss.id AND sub_status = ${CONSTANTS.ISSUE_SUB_STATUS_NUM.PAID}) as event_time
    FROM ${database}.invoice i
    JOIN ${database}.issue iss ON i.issue_id = iss.id
    JOIN ${database}.service s ON iss.service_type = s.id
    WHERE iss.org_id = ? 
    AND i.status = ${CONSTANTS.QUOTATION_STATUS.PAID}
    AND iss.resident_id = ?
    GROUP BY i.id;`  
  },
  getPaymentWithOrderByOrgID: (database) => {
    return `SELECT p.*, o.*
    FROM ${database}.payment p
    JOIN ${database}.order o ON p.order_id = o.id
    WHERE p.org_id = ?`
  }
}
