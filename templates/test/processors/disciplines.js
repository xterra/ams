const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    db.collection("disciplines").find().toArray(function(err, result){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      const disciplines = result;
      let userInfo = {};
      if( sessionContext !== undefined && sessionContext !== null && "login" in sessionContext){
        db.collection("users").findOne({username: sessionContext.login}, {securityRole : 1, username : 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          userInfo = result;
          console.log(userInfo);
          callback({
            title: "Disciplines list",
            urlDiscDetail: "/disciplines/",
            disciplines: disciplines,
            userInfo: userInfo
          }, "disciplines", 0, 0);
        });
      } else {
        userInfo.username = "John Doe";
        userInfo.securityRole = ['user'];
        callback({
          title: "Disciplines list",
          urlDiscDetail: "/disciplines/",
          disciplines: disciplines,
          userInfo: userInfo
        }, "disciplines", 0, 0);
      }
    });
  }
}
