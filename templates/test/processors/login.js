const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
    path: new RegExp(/^\/login\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken) {

        if (sessionToken !== null && sessionToken) {
            callback();
            return router.bleed(301, "/profiles/" + sessionContext["id"] + "/", response);
        }

        if (request.method === "POST") {
            router.downloadClientPostData(request, function (error, body) {
                if (error) {
                    callback();
                    return router.bleed(400, null, response);
                }
                try {
                    let post = qs.parse(body);
                    if (typeof post["login"] !== "string" || typeof post["password"] !== "string") {
                        callback();
                        return router.bleed(400, null, response);
                    }

                    let login = post["login"],
                        password = post["password"];

                    if (login.length === 0 || password.length === 0) {
                        return callback({
                            title: "Вход",
                            errorMessage: "Неправильный логин или пароль"
                        }, "login", 0, 0);
                    }

                    if (login.length < 5 || password.length < 8) {
                        return callback({
                            title: "Вход",
                            errorMessage: "Неправильный логин или пароль"
                        }, "login", 0, 0);
                    }

                    if (login.length > 16 || password.length > 64) {
                        return callback({
                            title: "Вход",
                            errorMessage: "Неправильный логин или пароль"
                        }, "login", 0, 0);
                    }

                    security.loginUsingCookies(login, password, request, response, function (sessionToken, sessionContext) {

                        if (sessionToken !== null && sessionToken) {

                            console.log("Logged in user, setting initial data to his context...");
                            console.log(`USER sessionContext: ${JSON.stringify(sessionContext)}`);
                            sessionContext["login"] = login;
                            sessionContext["loggedInTime"] = new Date();

                            security.updateSession(sessionToken, sessionContext, function (error, updated) {

                                if (error) {
                                    callback({
                                        title: "Вход",
                                        errorMessage: "Не можем обновить Вашу сессию с начальными данными!"
                                    }, "login", 0, 0);
                                } else {
                                    callback();
                                    return router.bleed(301, "/login/", response);
                                }

                            });

                        } else {
                            callback({
                                title: "Вход",
                                errorMessage: "Неправильный логин или пароль"
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
            title: "Вход",
            errorMessage: ""
        }, "login", 0, 0);
    }
};
