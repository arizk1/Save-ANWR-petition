const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");

module.exports.getSignatures = () => {
    return db.query("SELECT first, last FROM signatures");
};

module.exports.addSignature = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2, $3) 
    RETURNING id`;
    const params = [firstName, lastName, signature];
    return db.query(q, params);
};

module.exports.numSigners = () => {
    const q = `SELECT COUNT(id) FROM signatures`;
    return db.query(q);
};

module.exports.numSigniture = (id) => {
    const q = `SELECT signature FROM signatures WHERE id = ($1)`;
    const params = [id];
    return db.query(q, params);
};
