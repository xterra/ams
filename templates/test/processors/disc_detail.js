const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/.*$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split("/");
    disciplineAllias = delimeteredUrl[delimeteredUrl.length-1];
    db.collection("disciplines").findOne({allias : disciplineAllias}, function(err, result){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        console.log(`Not found discipline "${disciplineAllias}" redirecting on disciplines list...`);
        router.bleed(301, "/disciplines/", response);
      }
      const disc_detail = result;
      let userInfo = {};
      if( sessionContext !== undefined && sessionContext !== null && "login" in sessionContext){
        db.collection("users").findOne({username : sessionContext.login}, {securityRole : 1, username : 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          userInfo = result;
          callback({
            title: "Discipline detail",
            userInfo: userInfo,
            discipline: disc_detail
          }, "disc_detail", 0, 0);
        });
      } else {
        userInfo.username = "John Doe";
        userInfo.securityRole = ["user"];
        callback({
          title: "Discipline detail",
          userInfo: userInfo,
          discipline: disc_detail
        }, "disc_detail", 0, 0);
      }
    });
  }
}
