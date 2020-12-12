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
module.exports.deleteSignature = (id) => {
    const q = `DELETE FROM signatures WHERE userid = ($1);`;
    const params = [id];
    return db.query(q, params);
};

module.exports.getSig = (userid) => {
    const q = `SELECT signature FROM signatures WHERE userid = ($1)`;
    const params = [userid];
    return db.query(q, params);
};

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

module.exports.allData = (id) => {
    const q = `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url, user_profiles.userid
FROM users
JOIN user_profiles
ON users.id = user_profiles.userid
WHERE users.id = $1;`;
    const params = [id];
    return db.query(q, params);
};

module.exports.editRegistrationDataWithPW = (
    firstName,
    lastName,
    email,
    hashedPw,
    id
) => {
    const q = `UPDATE users 
    SET first = $1, last = $2, email = $3, password = $4
    WHERE id = $5`;
    const params = [firstName, lastName, email, hashedPw, id];
    return db.query(q, params);
};

module.exports.editRegistrationDataWithout = (
    firstName,
    lastName,
    email,
    id
) => {
    const q = `UPDATE users 
    SET first = $1, last = $2, email = $3
    WHERE id = $4`;
    const params = [firstName, lastName, email, id];
    return db.query(q, params);
};

module.exports.editProfileData = (age, city, url, id) => {
    const q = `INSERT INTO user_profiles (age, city, url, userid)
VALUES ($1, LOWER($2), $3, $4)
ON CONFLICT (userid)
DO UPDATE SET age=$1, city=LOWER($2), url=$3;`;
    const params = [age, city, url, id];
    return db.query(q, params);
};

module.exports.deleteProfile = (id) => {
    const q = `Delete from signatures where WHERE userid = ($1);
Delete from user_profiles WHERE userid = ($1)
Delete from users WHERE id = ($1);`;
    const params = [id];
    return db.query(q, params);
};
