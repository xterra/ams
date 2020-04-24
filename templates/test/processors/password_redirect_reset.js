const router = require("../../../router"),
      qs = require('querystring'),
      security = require("../../../security"),
      cookie = require('cookie');

module.exports = {
  path: new RegExp(/^\/password_reset\/[^\/]{0,70}\/$/),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    let requestedUrl = decodeURI(request.url);
    let delimiteredUrl = requestedUrl.split('/');
    let resetToken = delimiteredUrl[delimiteredUrl.length - 2];
    db.collection("sessions").findOne({_id: resetToken}, function(err, foundSession){
      if(err){
        console.error(`Error in password_redirect_reset -> find session from DB: ${err}`);
        callback();
        return router.bleed(500, null, response, err);
      }
      if(foundSession == null){
        console.log(`Session with token ${resetToken} not found in DB`);
        callback();
        return router.bleed(404, null, response);
      }
      let userSession = foundSession;
      db.collection("users").update({_id: userSession.ownerID}, {$set : {passwordReset: true}}, function(err){
        if(err){
          console.error(`Error in password_redirect_reset -> update user in DB: ${err}`);
          callback();
          return router.bleed(500, null, response, err);
        }
        const sessionCookieName = "SESSID",
              sessionLifetime = 24 * 60 * 60;
        response.setHeader("Set-Cookie", cookie.serialize(sessionCookieName, userSession._id, {
            expires: new Date((new Date()).getTime() + sessionLifetime * 1000),
            path: "/"
        }));
        callback();
        return router.bleed(301, "/password_reset/", response);
      })
    });
  }
}
