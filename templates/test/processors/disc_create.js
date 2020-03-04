const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/create\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username : sessionContext.login}, {username : 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 || (!userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("teacher"))){
        callback();
        return router.bleed(403, null, response);
      }
      if(request.method == "POST"){
        console.log(request);
        return router.downloadClientPostData(request, function(err, data){
          if(err){
            callback();
            return router.bleed(400, null, response, err);
          }
          try{
            const postData = qs.parse(data);

            console.log("allias: " + postData.allias);
            if(/[А-яЁё]/gi.test(postData.allias)){
              return callback({
                title: "Новая дисциплина",
                discipline: postData,
                errorMessage: "Краткое имя ссылки должно быть на английском!"
              }, "disc_form", 0, 0 );
            }
            db.collection("disciplines").insertOne({
              name: postData.name,
              mnemo: postData.mnemo,
              allias: postData.allias,
              description: postData.description,
              creator: userInfo._id.toString(),
              dateCreate: new Date(),
              dateUpdate: new Date(),
              lastEditor: userInfo._id.toString(),
              editors: [userInfo._id.toString()],
              files: []
            }, function(err){
              if(err) {
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log("Discipline created!");
              callback();
              return router.bleed(301, "/disciplines/", response);
            });
          } catch(err){
            console.log(`Processor error news_create: ${err}`);
            callback();
            return router.bleed(500, null, response, err);
          }
        }, 512);
      } else {
        return callback({
          title: "Новая дисциплина",
          errorMessage: ""
        }, "disc_form", 0, 0);
      }
    });
  }
}
