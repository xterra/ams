const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/delete\/.*$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split("/");
    disciplineAllias = delimeteredUrl[delimeteredUrl.length-1];

    if(request.method = "POST"){
      db.collection("disciplines").findOne({allias: disciplineAllias}, {name: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        console.log(`Find result:\n ${result}`);
        if(result == null){
          console.log(`Not found discipline "${disciplineAllias}" redirecting on disciplines list...`);
          callback();
          return router.bleed(301, "/disciplines/", response);
        }
      return db.collection("disciplines").deleteOne({allias: disciplineAllias}, function(err, result){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            console.log(result);
            callback();
            console.log("Discipline deleted!");
            return router.bleed(301, "/disciplines/", response);
          });
      });
    }
    db.collection("disciplines").findOne({allias: disciplineAllias}, {name: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      console.log(`Find result:\n ${result}`);
      if(result == null){
        console.log(`Not found discipline "${disciplineAllias}" redirecting on disciplines list...`);
        callback();
        return router.bleed(301, "/disciplines/", response);
      }
      return callback({
        title: "Delete discipline",
        nameDisc: result.name
      }, "disc_delete", 0, 0);
    });
  }
}
