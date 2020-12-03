const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");

module.exports.getSignatures = () => {
    const q = `SELECT (first, last) FROM signatures`;
    return db.query(q);
};

module.exports.addSignature = (firstName, lastName, signiture) => {
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2)`;
    const params = [firstName, lastName, signiture];
    return db.query(q, params);
};

module.exports.numSigners = () => {
    const q = `SELECT COUNT(id) FROM signatures`;
    return db.query(q);
};
