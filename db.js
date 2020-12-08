const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");

module.exports.getSignatures = () => {
    return db.query(`SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url,signatures.signature 
FROM users
JOIN user_profiles
ON users.id = user_profiles.userid 
LEFT JOIN signatures
ON users.id = signatures.userid;`);
};

module.exports.getSignaturesByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.url,signatures.signature
FROM user_profiles
JOIN users 
ON users.id = user_profiles.userid 
LEFT JOIN signatures
ON users.id = signatures.userid
WHERE city = LOWER($1);`;
    const params = [city];
    return db.query(q, params);
};

module.exports.addSignature = (userid, signature) => {
    const q = `INSERT INTO signatures (userid, signature) VALUES ($1, $2) 
    RETURNING id`;
    const params = [userid, signature];
    return db.query(q, params);
};

//New ifsigned =====>>>>> neet to be rechecked!!!!
module.exports.checkifUserSigned = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};

module.exports.addUser = (firstName, lastName, email, hashedPw) => {
    const q = `INSERT INTO users (first, last, email, password ) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id`;
    const params = [firstName, lastName, email, hashedPw];
    return db.query(q, params);
};

module.exports.addProfile = (age, city, url, userid) => {
    const q = `INSERT INTO user_profiles (age, city, url, userid )
    VALUES ($1, LOWER($2), $3, $4) 
    RETURNING id`;
    const params = [age, city, url, userid];
    return db.query(q, params);
};

module.exports.checkUserPW = (email) => {
    const q = `SELECT password FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

module.exports.numSigners = () => {
    const q = `SELECT COUNT(id) FROM signatures`;
    return db.query(q);
};

module.exports.numSigniture = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};
