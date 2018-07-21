var qs = require('querystring'),
    router = require("../../../router");

module.exports = {
    path: new RegExp(/^\/login\/$/u),
    processor: function (request, response, callback) {

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
                            errorMessage: "Login or password do not require minimal length!"
                        }, "login", 0, 0);
                    }

                    response.write("Login: " + post["login"] + "\n");
                    response.write("Password: " + post["password"]);
                    response.end();
                } catch (e) {
                    router.bleed(500, null, response, e);
                }
            }, 128);
            return callback();
        }

        callback({
            errorMessage: ""
        }, "login", 0, 0);
    }
};