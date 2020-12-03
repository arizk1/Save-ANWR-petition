const express = require("express");
const app = express();
const hp = require("express-handlebars");
const db = require("./db");
const cookieParser = require("cookie-parser");
const querystring = require("querystring");

app.use(express.static("./Public"));

app.engine("handlebars", hp());
app.set("view engine", "handlebars");

app.use(cookieParser());

app.use((req, res, next) => {
    console.log("--------------------");
    console.log(`${req.method} coming on route ${req.url}`);
    console.log("--------------------");
    next();
});

//------------------------------

app.get("/petition", (req, res) => {
    if (req.cookies.signed) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            title: "petition",
        });
    }
});

app.post("/petition", (req, res) => {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });
    req.on("end", () => {
        let parsedbody = querystring.parse(body);
        const { first, last, signature } = parsedbody;
        db.addSignature(first, last, signature)
            .then(() => {
                res.statusCode = 200;
                res.cookie("signed", true);
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("ERROR IN ADD Signature", err);
                // missing someting here
            });
    });
});

app.get("/thanks", (req, res) => {
    if (req.cookies.signed) {
        res.render("thanks", {
            layout: "main",
            title: "thanks",
        });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.cookies.signed) {
        res.render("signers", {
            layout: "main",
            title: "Signers",
            // numsigned: rows[0].count,
        });

        // Who signed?
        db.getSignatures()
            .then(({ rows }) => {
                console.log(rows);
            })
            .catch((err) => {
                console.log(err);
            });

        // number of the signers
        db.numSigners()
            .then(({ rows }) => {
                console.log(rows[0].count);
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("Server is LISTENING!!!"));
