const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security"),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
    path: new RegExp(/^\/profiles\/[^\/]{24,}\/$/u),
    processor: function (request, response, callback, sessionContext, sessionToken, db) {
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
        callback();
        return router.bleed(301, "/login/", response);
      }
        let urlPath = decodeURI(request.url);
        const ids = urlPath.match(/[^\/]{24}/g);
        console.log(ids);
        if (sessionContext !== null && ids.length > 0 && sessionContext !== undefined && ids[0].toString() == sessionContext.id) {

            if (request.method === "POST") {

                router.downloadClientPostData(request, function (error, body) {
                    if (error) {
                        console.error("An error occurred while loading client data", error);
                        return router.bleed(400, null, response, error);
                    }
                    try {
                        let post = qs.parse(body);

                        let key = post["key"],
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
            db.collection("users").findOne({ _id: new ObjectID(ids[0]) }, {username: 1, email: 1, securityRole: 1}, function(err, result){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log(result);
              if(result == null){
                callback();
                return router.bleed(404, request.url, response);
              }
              let strangerProfile = result;
              return db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                if(result == null){
                  callback();
                  return router.bleed(403, request.url, response);
                }
                let userInfo = result;
                return callback({
                    title: "Profile page",
                    strangerProfile: strangerProfile,
                    userInfo: userInfo
                }, "strangerProfile", 5, 5);
              });
            });
        }
    }
};
