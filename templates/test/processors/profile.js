var qs = require('querystring'),
    router = require("../../../router"),
    security = require("../../../security");

module.exports = {
    path: new RegExp(/^\/profile\/\d{6,}\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken) {

        var urlPath = decodeURI(request.url);
        var ids = urlPath.match(/\d+/g);

        if (sessionContext !== null && ids.length > 0 && ids[0] === sessionContext["id"]) {

            if (request.method === "POST") {

                router.downloadClientPostData(request, function (error, body) {
                    if (error) {
                        console.error("An error occurred while loading client data", error);
                        return router.bleed(400, null, response, error);
                    }
                    try {
                        var post = qs.parse(body);

                        var key = post["key"],
                            value = post["value"];

                        sessionContext[key] = value;

                        security.updateSessionFromRequest(request, response, sessionContext, function (updated) {
                            callback({
                                userId: sessionContext["id"],
                                userLogin: sessionContext["login"],
                                loginTime: sessionContext["loggedInTime"],
                                sessionToken: sessionToken,
                                storedData: JSON.stringify(sessionContext)
                            }, "profile", 0, 0);
                        });

                    } catch (e) {
                        console.error("Processor error, Profile: ", e);
                        router.bleed(500, null, response, e);
                    }
                }, 256);

            } else {

                callback({
                    userLogin: sessionContext["login"],
                    loginTime: sessionContext["loggedInTime"],
                    sessionToken: sessionToken,
                    storedData: JSON.stringify(sessionContext)
                }, "profile", 0, 0);

            }

        } else {

            callback({
                userID: ids[0]
            }, "strangerProfile", 5, 5);

        }

    }
};