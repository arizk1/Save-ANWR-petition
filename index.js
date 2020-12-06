const express = require("express");
const app = express();
const hp = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
const querystring = require("querystring");
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

app.get("/petition", (req, res) => {
    // console.log("session", req.session);
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
//WORKING!!
app.post("/petition", (req, res) => {
    const { first, last, signature } = req.body;
    db.addSignature(first, last, signature)
        .then(({ rows }) => {
            res.statusCode = 200;
            req.session.signed = true;
            req.session.id = rows[0].id;
            res.redirect("/thanks");
        })
        .catch(({ constraint }) => {
            console.log("ERROR IN ADDING DATA", constraint);
            let firstN;
            let lastN;
            let usSig;
            if (constraint === "signatures_first_check") {
                firstN = true;
            } else if (constraint === "signatures_last_check") {
                lastN = true;
            } else if (constraint === "signatures_signature_check") {
                usSig = true;
            }
            res.render("petition", {
                firstN,
                lastN,
                usSig,
            });
        });
});
//------------------------------
//WORKING!!
app.get("/thanks", (req, res) => {
    if (req.session.signed) {
        db.numSigners()
            .then(({ rows }) => {
                const totalSigniers = rows[0].count;
                db.numSigniture(req.session.id).then(({ rows }) => {
                    const userSig = rows[0].signature;
                    // console.log(userSig);
                    res.render("thanks", {
                        layout: "main",
                        title: "Thanks!",
                        conut: totalSigniers,
                        sig: userSig,
                    });
                });
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
    if (req.session.signed) {
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

app.listen(8080, () => console.log("Server is LISTENING!!!"));
