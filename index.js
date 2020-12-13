//##################################
//###### SETTINGS & MODULES #######
//#################################

const express = require("express");
const app = (exports.app = express());
const hp = require("express-handlebars");
const db = require("./db");
const { hash, compare } = require("./bc");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const {
    requireLoggedOutUser,
    requireSignedPetition,
    requireUnsignedPetition,
    requireLoggedInUser,
    saftyandRouts,
} = require("./middleware");

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

requireLoggedInUser;

app.use(saftyandRouts);

//##################################
//########### ROUTES ##############
//#################################

app.get("/", (req, res) => {
    res.render("firstpage", {
        layout: "main",
        title: "Save ANWR",
    });
});

app.get("/user", requireLoggedInUser, (req, res) => {
    res.render("firstpage", {
        layout: "login",
        title: "Save ANWR",
        username: req.session.username,
    });
});

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

app.get("/profile", requireLoggedInUser, (req, res) => {
    res.render("profile", {
        layout: "login",
        title: "profile",
        username: req.session.username,
    });
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    let userid = req.session.userid;
    console.log(age, city, url);
    if (url === "" || url.startsWith("https://") || url.startsWith("http://")) {
        db.addProfile(age, city, url, userid)
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("erorr in adding profile data", err);
                res.redirect("/profile");
            });
    } else {
        let other = true;
        res.render("profile", {
            layout: "login",
            title: "profile",
            username: req.session.username,
            other,
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
        title: "login",
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.checkUserPW(email)
        .then(({ rows }) => {
            let hashedPW = rows[0].password;
            console.log(hashedPW);
            console.log(password);
            compare(password, hashedPW).then((result) => {
                console.log(result);
                if (result) {
                    db.getUserIdByEmail(email).then(({ rows }) => {
                        req.session.userid = rows[0].id;
                        db.checkifUserSigned(req.session.userid)
                            .then(() => {
                                db.allData(req.session.userid).then(
                                    ({ rows }) => {
                                        req.session.username = rows[0].first;
                                        req.session.signed = true;
                                        req.session.logedin = true;
                                        res.redirect("/thanks");
                                    }
                                );
                            })
                            .catch(() => {
                                res.redirect("/petition");
                            });
                    });
                } else {
                    let other = true;
                    res.render("login", { other });
                }
            });
        })
        .catch((err) => {
            console.log("error in logging", err);
            let other = true;
            res.render("login", { other });
        });
});

app.get("/petition", requireLoggedInUser, (req, res) => {
    res.render("petition", {
        layout: "login",
        title: "petition",
        username: req.session.username,
    });
});

//------------------------------
app.post("/petition", requireLoggedInUser, (req, res) => {
    const { signature } = req.body;
    // let userID = req.session.userid;
    db.addSignature(req.session.userid, signature)
        .then(() => {
            req.session.signed = true;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("ERROR IN ADDING DATA", err);
            res.redirect("/petition");
        });
});

app.get("/edit", requireLoggedInUser, (req, res) => {
    db.allData(req.session.userid).then(({ rows }) => {
        // console.log(rows);
        res.render("edit", {
            layout: "login",
            title: "Edit your profile",
            data: rows[0],
            username: req.session.username,
        });
    });
});

app.post("/edit", requireLoggedInUser, (req, res) => {
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
app.get("/thanks", requireLoggedInUser, (req, res) => {
    db.numSigners()
        .then(({ rows }) => {
            const totalSigniers = rows[0].count;
            db.getSig(req.session.userid)
                .then(({ rows }) => {
                    let userSig = rows[0].signature;
                    db.allData(req.session.userid).then(({ rows }) => {
                        let userName = rows[0].first;
                        req.session.signed = true;
                        res.render("thanks", {
                            layout: "login",
                            title: "Thanks!",
                            conut: totalSigniers,
                            sig: userSig,
                            userName: userName,
                            username: userName,
                        });
                    });
                })
                .catch((err) => {
                    console.log("Error in password", err);
                    res.redirect("/petition");
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
app.get("/signers", requireSignedPetition, (req, res) => {
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

app.get("/signers/:cityUrl", requireSignedPetition, (req, res) => {
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

app.get("/profile/delete", requireLoggedInUser, (req, res) => {
    // req.session.userid = null;
    res.render("delete", {
        layout: "login",
        username: req.session.username,
    });
});

app.post("/profile/delete", requireLoggedInUser, (req, res) => {
    db.deleteProfile(req.session.userid)
        .then(() => {
            req.session.userid = null;
            req.session.signed = false;
            res.redirect("/");
        })
        .catch((err) => {
            console.log("ERORR in deleting account", err);
        });
});

app.get("/logout", (req, res) => {
    req.session.userid = null;
    res.redirect("/");
});

app.get("*", (req, res) => {
    res.redirect("/user");
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("Server is LISTENING!!!")
    );
}
