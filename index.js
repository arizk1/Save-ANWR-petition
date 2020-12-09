const express = require("express");
const app = express();
const hp = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

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
    res.render("firstpage", {
        layout: "main",
        title: "Save Arctic Wildlife Refuge",
    });
});

//------------------------------
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
        title: "register",
    });
});

app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;
    hash(password).then((hashedPW) => {
        console.log(hashedPW);
        db.addUser(first, last, email, hashedPW)
            .then(({ rows }) => {
                console.log(rows);
                req.session.userid = rows[0].id;
                req.session.registered = true;
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("error in registration", err);
                let other = true;
                res.render("register", { other });
            });
    });
});

app.get("/profile", (req, res) => {
    if (req.session.registered) {
        res.render("profile", {
            layout: "main",
            title: "profile",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    let userid = req.session.userid;
    console.log(age, city, url);
    if (
        url === null ||
        url.startsWith("https://") ||
        url.startsWith("http://")
    ) {
        db.addProfile(age, city, url, userid)
            .then((result) => {
                console.log(result);
                // if signed go to thanks if not go to sign
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("erorr in registering", err);
            });
    }
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
                db.getUserIdByEmail(email).then(({ rows }) => {
                    req.session.userid = rows[0].id;
                    db.checkifUserSigned(req.session.userid)
                        .then(({ rows }) => {
                            // req.session.signed = true;
                            res.redirect("/thanks");
                        })
                        .catch((err) => {
                            console.log(err);
                            res.redirect("/petition");
                        });
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
    res.render("petition", {
        layout: "main",
        title: "petition",
    });
});

//------------------------------
app.post("/petition", (req, res) => {
    const { signature } = req.body;
    // let userID = req.session.userid;
    db.addSignature(req.session.userid, signature)
        .then(() => {
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

app.get("/edit", (req, res) => {
    db.allData().then(({ rows }) => {
        console.log(rows);
        res.render("edit", {
            layout: "main",
            title: "Edit your profile",
            data: rows[0],
        });
    });
});

app.post("/edit", (req, res) => {
    const { first, last, email, password, age, city, url } = req.body;
    const userid = req.session.userid;
    if (password) {
        hash(password).then((hashedPw) => {
            console.log(hashedPw);
            db.editRegistrationDataWithPW(first, last, email, hashedPw, userid)
                .then(() => {
                    db.editProfileData(age, city, url, userid).then(() => {
                        res.redirect("/thanks");
                    });
                })
                .catch((err) => {
                    console.log("error in updating", err);
                });
        });
    } else {
        db.editRegistrationDataWithout(first, last, email, userid)
            .then(() => {
                db.editProfileData(age, city, url, userid).then(() => {
                    res.redirect("/thanks");
                });
            })
            .catch((err) => {
                console.log("error in updating", err);
            });
    }
});

//------------------------------
app.get("/thanks", (req, res) => {
    db.numSigners()
        .then(({ rows }) => {
            const totalSigniers = rows[0].count;
            db.getSig(req.session.userid).then(({ rows }) => {
                res.render("thanks", {
                    layout: "main",
                    title: "Thanks!",
                    conut: totalSigniers,
                    sig: rows[0].signature,
                });
            });
        })
        .catch((err) => {
            console.log(err);
        });
});
//------------------------------
app.get("/signers", (req, res) => {
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
});

app.get("/signers/:cityUrl", (req, res) => {
    const { cityUrl } = req.params;
    db.getSignaturesByCity(cityUrl)
        .then(({ rows }) => {
            res.render("city", {
                layout: "main",
                title: cityUrl,
                city: cityUrl,
                signers: rows,
            });
        })
        .catch((err) => {
            console.log("ERORR in CITY", err);
        });
});

//-------------------------------
app.get("*", (req, res) => {
    res.redirect("/");
});

app.listen(process.env.PORT || 8080, () =>
    console.log("Server is LISTENING!!!")
);
