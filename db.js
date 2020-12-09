const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/actors`
);

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

module.exports.getSig = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};

//New ifsigned =====>>>>> neet to be rechecked!!!!

module.exports.getUserIdByEmail = (email) => {
    const q = `SELECT id FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

module.exports.checkifUserSigned = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};

//===========================================================

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
    // const params = [user_id, age || null, city || null, url || null];
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

module.exports.allData = () => {
    return db.query(`SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
FROM users
JOIN user_profiles
ON users.id = user_profiles.userid 
JOIN signatures
ON users.id = signatures.userid;`);
};

module.exports.editRegistrationDataWithPW = (
    firstName,
    lastName,
    email,
    hashedPw,
    userid
) => {
    const q = `UPDATE users 
    SET first = $1, last = $2, email = $3, password = $4
    WHERE id = $5`;
    const params = [firstName, lastName, email, hashedPw, userid];
    return db.query(q, params);
};

module.exports.editRegistrationDataWithout = (
    firstName,
    lastName,
    email,
    userid
) => {
    const q = `UPDATE users 
    SET first = $1, last = $2, email = $3
    WHERE id = $4`;
    const params = [firstName, lastName, email, userid];
    return db.query(q, params);
};

module.exports.editProfileData = (age, city, url, userid) => {
    const q = `INSERT INTO user_profiles (age, city, url, userid )
VALUES ($1, LOWER($2), $3)
ON CONFLICT ($4)
DO UPDATE SET age = $1, city = LOWER($2), url = $3;`;
    const params = [age, city, url, userid];
    return db.query(q, params);
};
