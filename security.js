var fs = require("fs"),
    ini = require("ini"),
    path = require("path"),
    cookie = require('cookie'),
    randomstring = require("randomstring"),
    router = require("./router"),
    boot = require("./boot");

var sessionCookieName = "SESSID",
    loginCaseSensitive = true,
    passwordCaseSensitive = true,
    randomstringLength = 64,
    sessionLifetime = 7 * 24 * 60 * 60,
    contextCleanerInterval = 60;
var context;

function generateToken(callback) {
    // TODO: connection to database
    var token = null;
    while (token == null || typeof context[token] !== "undefined") {
        token = randomstring.generate(randomstringLength);
    }
    callback(null, token);
}

function loginUsingCookies(login, password, request, response, callback) {
    return getSessionFromRequest(request, response, function (sessionToken, sessionData) {
        if (sessionToken == null || sessionData == null) {
            console.log("User is not logged in, logging in...");
            return loginUsingToken(login, password, function (error, generatedSessionToken, createdSessionData) {
                if (error) {
                    console.error("An error occurred, while logging in using cookies:", error);
                    return router.bleed(500, null, response, error);
                }
                if (generatedSessionToken) {
                    // user can be not logged in - that is why there is condition
                    response.setHeader("Set-Cookie", cookie.serialize(sessionCookieName, generatedSessionToken, {
                        expires: new Date((new Date()).getTime() + sessionLifetime * 1000),
                        path: "/"
                    }));
                }
                return callback(generatedSessionToken, createdSessionData);
            });
        } else {
            // there is no need to make cookie update, because it will be in getSessionFromRequest
            console.log("User already logged in");
            return callback(sessionToken, sessionData);
        }
    });
}

function loginUsingToken(login, password, callback) {
    if (!loginCaseSensitive) {
        login = login.toLowerCase();
    }
    if (!passwordCaseSensitive) {
        password = password.toLowerCase();
    }
    if (login === "admin" && password === "password") {
        return generateToken(function (error, token) {
            context[token] = [new Date(), {}];
            // TODO: sync in DB
            callback(error, token, context[token][1]);
        });
    } else {
        callback(null, false, null);
    }
}

function logoutUsingCookies(request, response, callback) {
    return getSessionFromRequest(request, response, function (sessionToken) {
        if (sessionToken == null) {
            console.log("User is not logged in");
            return callback();
        } else {
            return logoutUsingToken(sessionToken, function (error) {
                if (error) {
                    console.error("An error occurred, while logging in using cookies:", error);
                    return router.bleed(500, null, response, error);
                }
                response.setHeader("Set-Cookie", cookie.serialize(sessionCookieName, "", {
                    expires: new Date(0),
                    path: "/"
                }));
                return callback();
            });
        }
    }, true);
}

function logoutUsingToken(sessionKey, callback) {
    delete context[sessionKey];
    // TODO: delete from DB
    callback(null);
}

function getSessionFromRequest(request, response, callback, restrictHeadersChange) {

    if (typeof request.headers.cookie === "undefined") {
        return callback(null, null);
    }

    if (typeof restrictHeadersChange !== "boolean") restrictHeadersChange = false;

    var rawCookies = request.headers.cookie;
    return getSessionFromCookies(rawCookies, function (error, sessionToken, sessionData) {
        if (error) {
            console.error("An error occurred, while getting session from request:", error);
            return router.bleed(500, null, response, error);
        }
        if (sessionToken !== null && sessionData !== null) {
            if (!restrictHeadersChange) response.setHeader("Set-Cookie", cookie.serialize(sessionCookieName, sessionToken, {
                expires: new Date((new Date()).getTime() + sessionLifetime * 1000),
                path: "/"
            }));
        }
        return callback(sessionToken, sessionData);
    });
}

function getSessionFromCookies(rawCookies, callback) {
    var cookies = cookie.parse(rawCookies);
    if (typeof cookies[sessionCookieName] !== "string") {
        console.log("User do not have session token in cookies");
        return callback(null, null);
    } else {
        var sessionToken = cookies[sessionCookieName];
        console.log("User have session token:", sessionToken);
        return getSessionData(sessionToken, function (error, sessionData) {
            callback(error, sessionToken, sessionData);
        });
    }
}

function getSessionData(sessionToken, callback) {
    if (typeof context[sessionToken] !== "undefined") {
        // TODO: update session lifetime in DB
        context[sessionToken][0] = new Date();
        callback(null, context[sessionToken][0]);
    } else {

        callback(null, null);

        // TODO: update session lifetime in cache and DB
        // TODO: add go to DB to load and update
    }
}

function updateSessionFromRequest(request, response, sessionData, callback) {

}

function updateSessionFromCookies(cookies, sessionData, callback) {

}

function updateSession(sessionKey, sessionData, callback) {

}

function reloadConfigurations() {
    var securityConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, "configurations", "security.ini"), "utf-8"));

    if (typeof securityConfigurations["client"]["sessionCookieName"] === "string")
        sessionCookieName = securityConfigurations["client"]["sessionCookieName"];
    console.log("Configs, session cookie name:\t", sessionCookieName);

    if (typeof securityConfigurations["authorization"]["loginCaseSensitive"] === "boolean")
        loginCaseSensitive = securityConfigurations["authorization"]["loginCaseSensitive"];
    console.log("Configs, login case sensitive:\t", loginCaseSensitive);

    if (typeof securityConfigurations["authorization"]["passwordCaseSensitive"] === "boolean")
        passwordCaseSensitive = securityConfigurations["authorization"]["passwordCaseSensitive"];
    console.log("Configs, pass case sensitive:\t", passwordCaseSensitive);

    if (typeof securityConfigurations["authorization"]["tokenLength"] === "string")
        randomstringLength = parseInt(securityConfigurations["authorization"]["tokenLength"]);
    console.log("Configs, secret token length:\t", randomstringLength);

    if (typeof securityConfigurations["client"]["sessionCookieLifetime"] === "string")
        sessionLifetime = parseInt(securityConfigurations["client"]["sessionCookieLifetime"]);
    console.log("Configs, session lifetime:\t\t", sessionLifetime);

    if (typeof securityConfigurations["server"]["contextCleanerInterval"] === "string")
        contextCleanerInterval = parseInt(securityConfigurations["server"]["contextCleanerInterval"]);
    console.log("Configs, context cleaning secs:\t", contextCleanerInterval);
}

function resetContext() {
    context = {};
    console.log("Context reset done");
}


var cleanerTicker = null;

function runCleaner() {
    if (cleanerTicker == null) {
        cleanerTicker = setInterval(function () {
            console.log("Cleaning security context...");
            // TODO: clear context!
        }, contextCleanerInterval * 1000);
    }
}

function stopCleaner() {
    if (cleanerTicker !== null) {
        clearInterval(cleanerTicker);
        cleanerTicker = null;
    }
}

module.exports = {
    prepare: function (callback) {
        resetContext();
        reloadConfigurations();
        runCleaner();
        callback();
    },
    resetContext: resetContext,
    reloadConfigurations: reloadConfigurations,
    getSessionFromCookies: getSessionFromCookies,
    getSessionFromRequest: getSessionFromRequest,
    getSession: getSessionData,
    loginUsingCookies: loginUsingCookies,
    loginUsingToken: loginUsingToken,
    logoutUsingCookies: logoutUsingCookies,
    logoutUsingToken: logoutUsingToken,
    updateSessionFromRequest: updateSessionFromRequest,
    updateSessionFromCookies: updateSessionFromCookies,
    updateSession: updateSession,
    runCleaner: runCleaner,
    stopCleaner: stopCleaner
};