const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");
//modified
module.exports.getSignatures = () => {
    return db.query("SELECT first, last FROM users");
};
//modified
module.exports.addSignature = (userid, signature) => {
    const q = `INSERT INTO signatures (userid, signature) VALUES ($1, $2) 
    RETURNING id`;
    const params = [userid, signature];
    return db.query(q, params);
};

//New ifsigned =====>>>>>
module.exports.checkifUserSigned = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};
//New
module.exports.addUser = (firstName, lastName, email, hashedPw) => {
    const q = `INSERT INTO users (first, last, email, password ) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id`;
    const params = [firstName, lastName, email, hashedPw];
    return db.query(q, params);
};

//New
module.exports.checkUserPW = (email) => {
    const q = `SELECT password FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

//Same
module.exports.numSigners = () => {
    const q = `SELECT COUNT(id) FROM signatures`;
    return db.query(q);
};
//Same
module.exports.numSigniture = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};
