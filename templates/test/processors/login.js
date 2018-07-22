var qs = require('querystring'),
    router = require("../../../router"),
    security = require("../../../security");

module.exports = {
    path: new RegExp(/^\/login\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken) {

        if (sessionToken !== null && sessionToken) {
            callback();
            return router.bleed(301, "/profile/" + sessionContext["id"] + "/", response);
        }

        if (request.method === "POST") {
            router.downloadClientPostData(request, function (error, body) {
                if (error) {
                    callback();
                    return router.bleed(400, null, response);
                }
                try {
                    var post = qs.parse(body);
                    if (typeof post["login"] !== "string" || typeof post["password"] !== "string") {
                        callback();
                        return router.bleed(400, null, response);
                    }

                    var login = post["login"],
                        password = post["password"];

                    if (login.length === 0 || password.length === 0) {
                        return callback({
                            errorMessage: "Login or password can't be empty!"
                        }, "login", 0, 0);
                    }

                    if (login.length < 5 || password.length < 8) {
                        return callback({
                            errorMessage: "Логин и пароль слишном короткие!"
                        }, "login", 0, 0);
                    }

                    if (login.length > 16 || password.length > 64) {
                        return callback({
                            errorMessage: "Login or password are too long!"
                        }, "login", 0, 0);
                    }

                    security.loginUsingCookies(login, password, request, response, function (sessionToken, sessionContext) {

                        if (sessionToken !== null && sessionToken) {

                            console.log("Logged in user, setting initial data to his context...");

                            sessionContext["id"] = "000000";
                            sessionContext["login"] = login;
                            sessionContext["loggedInTime"] = new Date();

                            security.updateSession(sessionToken, sessionContext, function (error, updated) {

                                if (error) {
                                    callback({
                                        errorMessage: "Can't update your session with init data!"
                                    }, "login", 0, 0);
                                } else {
                                    callback();
                                    return router.bleed(301, "/login/", response);
                                }

                            });

                        } else {
                            callback({
                                errorMessage: "Wrong login or password"
                            }, "login", 0, 0);
                        }


                    });

                } catch (e) {
                    console.error("Processor error, Login: ", e);
                    router.bleed(500, null, response, e);
                    callback();
                }
            }, 256);
            return;
        }

        callback({
            errorMessage: ""
        }, "login", 0, 0);
    }
};