const router = require("../../../router"),
      security = require("../../../security");

module.exports = {
    path: new RegExp(/^\/logout\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken) {
        if (sessionToken !== null) {
            callback();
            security.logoutUsingCookies(request, response, function () {
                router.bleed(301, "http://" + request.headers.host + "/login/", response);
            });
        } else {
            console.log(sessionToken, sessionContext);
            let out = "You are not authorized :/";
            response.writeHead(200, {
                "Cache-Control": "no-cache",
                "Content-Type": "text/html; charset=utf-8",
                "Content-Size": out.length
            });
            response.end(out);
        }
    }
};
