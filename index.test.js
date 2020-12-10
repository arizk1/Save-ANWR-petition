const supertest = require("supertest");
const cookieSession = require("cookie-session");
const { app } = require("./index");

test("GET should send 200 statuscode as a response", () => {
    return supertest(app)
        .get("/register")
        .then((response) => {
            // console.log(response.statusCode);
            expect(response.statusCode).toBe(200);
        });
});

// test("POST / registration works ..", () => {
//     return supertest(app)
//         .post("/login")
//         .then((response) => {
//             console.log(response.headers);
//             expect(response.statusCode).toBe(302);
//         });
// });

test("GET / sends 302 when there is no Cookies", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/thanks")
        .then((response) => {
            console.log(response.statusCode);
            expect(response.statusCode).toBe(302);
        });
});

test("GET / sends 302 when there is Cookies", () => {
    cookieSession.mockSessionOnce({
        userid: 4,
    });
    return supertest(app)
        .get("/thanks")
        .then((response) => {
            console.log(response.statusCode);
            expect(response.statusCode).toBe(200);
        });
});
