const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/profiles\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").find({}, {username: 1, securityRole: 1}).toArray(function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      let users = result;
      return callback({
        title: "Profiles list",
        profiles: users,
        userName: sessionContext.login
      }, "profile_list", 0, 0);
    });
  }
}
