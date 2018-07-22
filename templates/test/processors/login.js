var qs = require('querystring'),
    router = require("../../../router"),
    security = require("../../../security");

module.exports = {
    path: new RegExp(/^\/login\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken) {

        if (sessionContext !== null) {
            var out = "You already logged in!<br/>Your token is: " + sessionToken + "<br/><br/><button onmousedown='window.location=\"/logout/\"'>Logout me!</button>";
            response.writeHead(200, {
                "Cache-Control": "no-cache",
                "Content-Type": "text/html; charset=utf-8",
                "Content-Size": out.length
            });
            response.end(out);
        }

        if (request.method === "POST") {
            router.downloadClientPostData(request, function (error, body) {
                if (error) {
                    return router.bleed(400, null, response);
                }
                try {
                    var post = qs.parse(body);
                    if (typeof post["login"] !== "string" || typeof post["password"] !== "string") {
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

                    security.loginUsingCookies(login, password, request, response, function (sessionToken, sessionData) {
                        var out;
                        if (sessionToken) {
                            out = "You have been authed!"
                        } else {
                            out = "Wrong login/password"
                        }
                        response.writeHead(200, {
                            "Cache-Control": "no-cache",
                            "Content-Type": "text/html; charset=utf-8",
                            "Content-Size": out.length
                        });
                        response.end(out);
                    });
                } catch (e) {
                    console.error("Processor error, Login: ", e);
                    router.bleed(500, null, response, e);
                }
            }, 256);
            return callback();
        }

        callback({
            errorMessage: ""
        }, "login", 0, 0);
    }
};