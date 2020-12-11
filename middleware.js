exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.userid) {
        res.redirect("/");
    } else {
        next();
    }
};

exports.requireUnsignedPetition = (req, res, next) => {
    if (req.session.signed) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

exports.requireSignedPetition = (req, res, next) => {
    if (!req.session.signed) {
        res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.requireLoggedInUser = (req, res, next) => {
    if (
        !req.session.userid &&
        req.url != "/register" &&
        req.url != "/login" &&
        req.url != "/"
    ) {
        res.redirect("/register");
    } else {
        next();
    }
};

exports.saftyandRouts = (req, res, next) => {
    console.log("--------------------");
    console.log(`${req.method} coming on route ${req.url}`);
    console.log("--------------------");
    res.set("x-frame-options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
};
