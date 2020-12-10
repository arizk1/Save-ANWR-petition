const express = require("express");
const app = (exports.app = express());
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

//########### MIDDLE WARE TO BE COMPLETED #############

app.use((req, res, next) => {
    if (
        !req.session.userid &&
        req.url != "/login" &&
        req.url != "/register" &&
        req.url != "/"
    ) {
        res.redirect("/register");
    } else {
        next();
    }
});

const requireLoggedOutUser = (req, res, next) => {
    if (req.session.userid) {
        res.redirect("/");
    } else {
        next();
    }
};

const requireUnsignedPetation = (req, res, next) => {
    if (req.session.sigId) {
        res.redirect("/");
    } else {
        next();
    }
};
//###########################################

app.get("/", (req, res) => {
    res.render("firstpage", {
        layout: "main",
        title: "Save ANWR",
    });
});

app.get("/user", (req, res) => {
    res.render("firstpage", {
        layout: "login",
        title: "Save ANWR",
        username: req.session.username,
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
                req.session.logedin = true;
                req.session.username = first;
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
    if (req.session.logedin) {
        res.render("profile", {
            layout: "login",
            title: "profile",
            username: req.session.username,
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
        // console.log(rows[0].password);
        let hashedPW = rows[0].password;
        compare(password, hashedPW)
            .then(() => {
                db.getUserIdByEmail(email).then(({ rows }) => {
                    req.session.userid = rows[0].id;
                    db.checkifUserSigned(req.session.userid)
                        .then(() => {
                            db.allData(req.session.userid).then(({ rows }) => {
                                req.session.username = rows[0].first;
                                req.session.signed = true;
                                req.session.logedin = true;
                                res.redirect("/thanks");
                            });
                        })
                        .catch((err) => {
                            console.log("error in logging", err);
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
        layout: "login",
        title: "petition",
        username: req.session.username,
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
    db.allData(req.session.userid).then(({ rows }) => {
        console.log(rows);
        res.render("edit", {
            layout: "login",
            title: "Edit your profile",
            data: rows[0],
            username: req.session.username,
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
                    console.log("error in updating 1", err);
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
                console.log("error in updating 2", err);
            });
    }
});

//------------------------------
app.get("/thanks", (req, res) => {
    db.numSigners()
        .then(({ rows }) => {
            const totalSigniers = rows[0].count;
            db.getSig(req.session.userid).then(({ rows }) => {
                let userSig = rows[0].signature;
                db.allData(req.session.userid).then(({ rows }) => {
                    let userName = rows[0].first;
                    res.render("thanks", {
                        layout: "login",
                        title: "Thanks!",
                        conut: totalSigniers,
                        sig: userSig,
                        userName: userName,
                        username: userName,
                    });
                });
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.userid).then(() => {
        req.session.signed = false;
        res.redirect("/petition");
    });
});
//------------------------------
app.get("/signers", (req, res) => {
    db.getSignatures()
        .then(({ rows }) => {
            res.render("signers", {
                layout: "login",
                title: "Signers",
                signers: rows,
                username: req.session.username,
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
                layout: "login",
                title: cityUrl,
                city: cityUrl,
                signers: rows,
                username: req.session.username,
            });
        })
        .catch((err) => {
            console.log("ERORR in CITY", err);
        });
});

app.get("/logout", (req, res) => {
    req.session.userid = null;
    res.redirect("/");
    // res.sendStatus(200);
});
//-------------------------------
app.get("*", (req, res) => {
    res.redirect("/");
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("Server is LISTENING!!!")
    );
}
