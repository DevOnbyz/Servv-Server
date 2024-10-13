const { add } = require("lodash");

module.exports = {
  addResident(database) {
    return `INSERT INTO ${database}.resident SET ?`;
  },
  getResidentByNameAndIdentity(database) {
    return `SELECT * FROM ${database}.resident WHERE firstname = ? AND lastname = ? AND email = ? AND resident_identity_id = ?`;
  },
  getResidentIdentityByPhNum(database){
    return `SELECT * FROM ${database}.resident_identity where ph_num = ?`
  },
  addResidentIdentity(database){
    return `INSERT INTO ${database}.resident_identity SET ?`
  },
  addApartment(database){
    return `INSERT INTO ${database}.apartment SET ?`
  },
  getApratmentByProjectAndName(database){
    return `SELECT * FROM ${database}.apartment WHERE project_id = ? AND name = ?`
  },
  addApartmentResidentRel(database){
    return `INSERT INTO ${database}.apartment_resident_rel SET ?`
  },
  getResidentDataUnderOrg(database){
    return `
    SELECT 
    i.ph_num,            
    r.email_id,
    r.firstname,
    r.lastname,
    a.name AS doorNo,
    p.name AS projectName,
    p.city AS city, 
    p.district AS district, 
    p.state AS state, 
    p.country AS country
FROM 
    ${database}.resident_identity i
JOIN 
    ${database}.resident r ON i.id = r.identity_id
JOIN 
    ${database}.apartment_resident_rel arr ON r.id = arr.resident_id
JOIN 
    ${database}.apartment a ON arr.apartment_id = a.id
JOIN 
    ${database}.project p ON a.project_id = p.id
WHERE 
    p.org_id = ?;
    `
  }
};
