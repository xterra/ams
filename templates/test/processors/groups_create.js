const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/groups\/new\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 && !userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("admin")){
        callback();
        return router.bleed(403, null, response);
      }

        if(request.method === "POST"){
          router.downloadClientPostData(request, function(err, data){
            if(err){
              callback();
              return router.bleed(400, null, response);
            }
            try{
              const postData = qs.parse(data);
              if(/[А-яЁё]/gi.test(postData.url)){
                return callback({
                  title: "Новая группа",
                  group: postData,
                  errorMessage: "Имя группы для ссылки должно быть на английском!"
                }, "groups_form", 0, 0 );
              }
              db.collection("groups").findOne({url: postData.url}, {_id: 1}, function(err, foundGroup){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                if(foundGroup){
                  return callback({
                    title: "Новая группа",
                    group: postData,
                    errorMessage: "Группа с таким URL уже существует!"
                  }, "groups_form", 0, 0);
                } else{
                  db.collection("groups").insertOne({
                    name: postData.name,
                    course: postData.course,
                    fullname: postData.fullname,
                    url: postData.url,
                    typeEducation: postData.typeEducation
                  }, function(err){
                    if(err) {
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    console.log("Group created!");
                    callback();
                    return router.bleed(301, "/groups/", response);
                  });
                }
              });
            }catch(err){
              console.log(`Processor error groups_create: ${err}`);
              callback();
              return router.bleed(500, null, response, err);
            }
          });
        } else{
          return callback({
            title: "Новая группа",
            errorMessage: ""
          }, "groups_form", 0, 0 );
        }
    });
  }
}
