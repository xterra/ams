const fs = require("fs"),
      ini = require("ini"),
      path = require("path"),
      cookie = require('cookie'),
      randomstring = require("randomstring"),
      md5 = require("md5");

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
    makeSessionUsingToken: makeSessionUsingToken,
    makeSession: makeSession,
    logoutUsingCookies: logoutUsingCookies,
    logoutUsingToken: logoutUsingToken,
    updateSessionFromRequest: updateSessionFromRequest,
    updateSessionFromCookies: updateSessionFromCookies,
    updateSession: updateSession,
    runCleaner: runCleaner,
    stopCleaner: stopCleaner
};

const router = require("./router"),
      boot = require("./boot");

let   sessionCookieName = "SESSID",
      loginCaseSensitive = true,
      passwordCaseSensitive = true,
      randomstringLength = 64,
      randomstringType = "alphanumeric", // alphanumeric, numeric, alphabetic, hex
      sessionLifetime = 7 * 24 * 60 * 60,
      sessionTokenInMemoryLifetime = 43200,
      sessionTokenInMemoryMaxSize = 10000,
      contextCleanerInterval = 60;
let   context;

function generateToken(callback) {
    if (boot.isConnected()) {
        let generationInProcess = false;
        let generatorInterval = setInterval(function () {
            if (generationInProcess) return;
            generationInProcess = true;
            let token = generateTokenInMemory();
            boot.getDB().collection("sessions").findOne({
                _id: token
            }, {_id: 1}, function (error, found) {
                if (error) {
                    clearInterval(generatorInterval);
                    return callback(error, null);
                }
                if (found == null ) {
                    clearInterval(generatorInterval);
                    return callback(null, token);
                } else {
                    generationInProcess = false;
                    console.warn("Generated token for user is already in DB. Is that ok? May be you should check configs?");
                }
            });
        }, 0);
    } else {
        return callback(null, generateTokenInMemory());
    }
}

function generateTokenInMemory() {
    let token = null;
    while (token == null || typeof context[token] !== "undefined") {
        token = randomstring.generate({
            length:randomstringLength,
            charset: randomstringType
        });
    }
    return token;
}

function loginUsingCookies (login, password, request, response, callback) {
    return getSessionFromRequest(request, response, function (sessionToken, sessionData) {
        if (sessionToken == null || sessionData == null) {
            console.log("User is not logged in, logging in...");
            return loginUsingToken(login, password, function (error, generatedSessionToken, createdSessionData) {
                if (error) {
                    console.error("An error occurred, while logging in using cookies:", error);
                    return router.bleed(500, null, response, error);
                }
                if (generatedSessionToken) {
                    // user can fail login - that is why there is condition
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
    }, true);
}

function loginUsingToken (login, password, callback) {
    if (!loginCaseSensitive) {
        login = login.toLowerCase();
    }
    if (!passwordCaseSensitive) {
        password = password.toLowerCase();
    }
    password = md5(password); // TODO: SHA-256
    if (boot.isConnected()) {
        boot.getDB().collection("users").findOne({
            username : login,
            password : password
        }, {
            _id : 1
        }, null, function(error, found){
            if (error) {
                return callback(error, false, null);
            }
            if(found){
                console.log("Authing user " + found._id + "...");
                return makeSession(found._id, function(error, token, sessionData){
                    if(error) return callback(error, false, null);
                    console.info("User "+ found._id +" authed!");
                    sessionData["id"] = found._id;
                    callback(null, token, sessionData);
                });
            } else {
                callback(null, false, null);
            }
        });
    } else {
        if (login === "admin" && password === "5f4dcc3b5aa765d61d8327deb882cf99") {
            return makeSession("5f4dcc3b5aa765d61d8327deb882cf99", function(error, token, sessionData){
                if(error) return callback(error, false, null);
                callback(null, token, sessionData);
            });
        } else {
            callback(null, false, null);
        }
    }
}

function makeSession (userID, callback) {
    return generateToken(function (error, token) {
        if(error) return callback(error, false, null, null);
        makeSessionUsingToken(token, userID, callback);
    });
}

function makeSessionUsingToken (token, userID, callback) {
    let defaultSessionData = {};
    if(boot.isConnected()){
        return storeSessionInDB(token, defaultSessionData, userID, function(error, storedSessionData){
            if(error){
                return callback(error, false, null, null);
            }
            let sessionData = storeSessionInMemory(token, storedSessionData, userID);
            return callback(null, token, sessionData, userID);
        });
    } else {
        console.warn("New session stored at in-memory cache");
        let sessionData = storeSessionInMemory(token, defaultSessionData, userID);
        return callback(null, token, sessionData, userID);
    }
}

function storeSessionInDB(token, sessionData, userID, callback){
    return boot.getDB().collection("sessions").insertOne({
        _id : token,
        data: sessionData,
        freshness: new Date(),
        ownerID: userID
    }, null, function(error, result) {
        if (error) {
            return callback(error, null, null);
        }
        callback(null, result.ops[0].data, result.ops[0].ownerID);
    });
}

function storeSessionInMemory(token, sessionData, userID){
    context[token] = [new Date(), sessionData, userID];
    return context[token][1];
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
    try{
      boot.getDB().collection("sessions").deleteOne({_id: sessionKey});
    }catch(err){
      console.log(`Error with deleting session token from ${err}`);
    }
    callback(null);
}

function getSessionFromRequest(request, response, callback, restrictHeadersChange) {

    if (typeof request.headers.cookie === "undefined") {
        return callback(null, null);
    }

    if (typeof restrictHeadersChange !== "boolean") restrictHeadersChange = false;

    const rawCookies = request.headers.cookie;
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
    const cookies = cookie.parse(rawCookies);
    if (typeof cookies[sessionCookieName] !== "string") {
        console.log("User do not have session token in cookies");
        return callback(null, null);
    } else {
        const sessionToken = cookies[sessionCookieName];
        console.log("User have session token:", sessionToken);
        return getSessionData(sessionToken, function (error, sessionData) {
            callback(error, sessionData !== null ? sessionToken : false, sessionData);
        });
    }
}

function getSessionData(sessionToken, callback) {
    if (typeof context[sessionToken] !== "undefined") {
        // TODO: update session lifetime in DB
        console.log(`\ngetSessionData: ${JSON.stringify(context[sessionToken])}  \n`);
        context[sessionToken][0] = new Date();
        callback(null, context[sessionToken][1]);
    } else {
        boot.getDB().collection("sessions").findOne({_id: sessionToken}, function(err, result){
          if(err) console.log(err)
          console.log(`Get info about session: ${JSON.stringify(result)}`);
        });

        callback(null, null);

        // TODO: update session lifetime in cache and DB
        // TODO: add go to DB to load and update
    }
}

function updateSessionFromRequest(request, response, sessionData, callback) {

    if (typeof request.headers.cookie === "undefined") {
        return callback(null, false);
    }

    const rawCookies = request.headers.cookie;
    return updateSessionFromCookies(rawCookies, sessionData, function (error, updated) {
        if (error) {
            console.error("An error occurred, while logging in using cookies:", error);
            return router.bleed(500, null, response, error);
        }
        return callback(updated);
    });
}

function updateSessionFromCookies(rawCookies, sessionData, callback) {
    const cookies = cookie.parse(rawCookies);
    if (typeof cookies[sessionCookieName] !== "string") {
        console.log("User do not have session token in cookies");
        return callback(null, false);
    } else {
        const sessionToken = cookies[sessionCookieName];
        console.log("User have session token:", sessionToken);
        return updateSession(sessionToken, sessionData, callback);
    }
}

function updateSession(sessionToken, sessionData, callback) {
    if (typeof context[sessionToken] !== "undefined") {
        // TODO: update session in DB
        context[sessionToken][1] = sessionData;
        callback(null, true);
    } else {
        console.warn("User do not have stored data in context. Is that okay, damn?", sessionToken);
        callback(null, false);
    }
}

function reloadConfigurations() {
    let securityConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, "configurations", "security.ini"), "utf-8"));

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

    if (typeof securityConfigurations["authorization"]["tokenGeneratorMode"] === "string")
        randomstringType = securityConfigurations["authorization"]["tokenGeneratorMode"];
    console.log("Configs, token generator mode:\t:", randomstringType);

    if (typeof securityConfigurations["client"]["sessionCookieLifetime"] === "string")
        sessionLifetime = parseInt(securityConfigurations["client"]["sessionCookieLifetime"]);
    console.log("Configs, session lifetime:\t\t", sessionLifetime);

    if (typeof securityConfigurations["server"]["sessionTokenInMemoryLifetime"] === "string")
        sessionTokenInMemoryLifetime = parseInt(securityConfigurations["server"]["sessionTokenInMemoryLifetime"]);
    console.log("Configs, session token in RAM:\t", sessionTokenInMemoryLifetime);

    if (typeof securityConfigurations["server"]["sessionTokenInMemoryMaxSize"] === "string")
        sessionTokenInMemoryMaxSize = parseInt(securityConfigurations["server"]["sessionTokenInMemoryMaxSize"]);
    console.log("Configs, sessions amount in RAM:", sessionTokenInMemoryMaxSize);

    if (typeof securityConfigurations["server"]["contextCleanerInterval"] === "string")
        contextCleanerInterval = parseInt(securityConfigurations["server"]["contextCleanerInterval"]);
    console.log("Configs, context cleaning secs:\t", contextCleanerInterval);


}

function resetContext() {
    context = {};
    console.log("Context reset done");
}


let cleanerTicker = null;

function runCleaner() {
    if (cleanerTicker == null) {
        cleanerTicker = setInterval(function () {
            console.log("Cleaning security context...");
            // TODO: clear context!
            const TWO_DAYS_IN_MS = 1728000;
            let currentTime = new Date();
            let expiresTime = currentTime - TWO_DAYS_IN_MS;
            boot.getDB().collection("sessions").remove({freshness: {$lte: new Date(expiresTime) }}, function(err, result){
              if(err) console.log(err);
              console.log(`Sessions deleted:\n ${JSON.stringify(result)}`);
            });
        }, contextCleanerInterval * 1000);
    }
}

function stopCleaner() {
    if (cleanerTicker !== null) {
        clearInterval(cleanerTicker);
        cleanerTicker = null;
    }
}
