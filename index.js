const express = require("express");
const app = express();
const hp = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
// const cookieParser = require("cookie-parser");

app.engine("handlebars", hp());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(csurf());

app.use(express.static("./Public"));

app.use((req, res, next) => {
    console.log("--------------------");
    console.log(`${req.method} coming on route ${req.url}`);
    console.log("--------------------");
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//------------------------------

app.get("/", (req, res) => {
    res.redirect("/petition");
});

//------------------------------
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
        title: "register",
    });
});
//WORKING!!
app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;
    hash(password).then((hashedPW) => {
        console.log(hashedPW);
        db.addUser(first, last, email, hashedPW)
            .then(({ rows }) => {
                // console.log(rows);
                req.session.userid = rows[0].id;
                req.session.registered = true;
                res.redirect("/login");
            })
            .catch((err) => {
                console.log("error in registration", err);
                let other = true;
                res.render("register", { other });
            });
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
        title: "login",
    });
});

//WORKING!!
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.checkUserPW(email).then(({ rows }) => {
        let hashedPW = rows[0].password;
        compare(password, hashedPW)
            .then(() => {
                db.checkifUserSigned(req.session.userid)
                    .then(({ rows }) => {
                        req.session.sigId = rows[0].signature;
                        req.session.signed = true;
                        res.redirect("/thanks");
                    })
                    .catch((err) => {
                        console.log(err);
                        res.redirect("/petition");
                    });
            })
            .catch((err) => {
                console.log("error in logging", err);
                let other = true;
                res.render("login", { other });
            });
    });
});
// to add furst and last name and a personalized massege
app.get("/petition", (req, res) => {
    if (req.session.signed) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "petition",
        });
    }
});

//------------------------------
// still to redirect to registration
app.post("/petition", (req, res) => {
    const { signature } = req.body;
    let userID = req.session.userid;
    db.addSignature(userID, signature)
        .then(({ rows }) => {
            res.statusCode = 200;
            req.session.signed = true;
            req.session.id = rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("ERROR IN ADDING DATA", err);
            let usSig = true;
            res.render("petition", {
                usSig,
            });
        });
});
//------------------------------
//WORKING!!
app.get("/thanks", (req, res) => {
    if (req.session.signed && req.session.registered) {
        db.numSigners()
            .then(({ rows }) => {
                const totalSigniers = rows[0].count;
                // db.checkifUserSigned(req.session.sigId).then(({ rows }) => {
                // const userSig = rows[0].signature;
                res.render("thanks", {
                    layout: "main",
                    title: "Thanks!",
                    conut: totalSigniers,
                    sig: req.session.sigId,
                });
                // });
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});
//------------------------------
//WORKING!!
app.get("/signers", (req, res) => {
    if (req.session.signed && req.session.registered) {
        db.getSignatures()
            .then(({ rows }) => {
                res.render("signers", {
                    layout: "main",
                    title: "Signers",
                    signers: rows,
                });
            })
            .catch((err) => {
                console.log("ERORR!!!", err);
            });
    } else {
        res.redirect("/petition");
    }
});
//-------------------------------
app.get("*", (req, res) => {
    res.redirect("/");
});

app.listen(8080, () => console.log("Server is LISTENING!!!"));