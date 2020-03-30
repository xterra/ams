const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/edit\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split("/");
    disciplineAllias = delimeteredUrl[delimeteredUrl.length-2];
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
      db.collection("disciplines").findOne({allias: disciplineAllias}, function(err, result){
        if(err){
          callback();
          router.bleed(500, null, response, err);
        }
        if(result == null){
          console.log(`Not found discipline "${disciplineAllias}" redirecting on disciplines list...`);
          callback();
          router.bleed(301, "/disciplines/", response);
        }
        const disc_detail = result;
        db.collection("groups").find().toArray(function(err, result){
          if(err){
            callback();
            router.bleed(500, null, response, err);
          }
          const groupsInfo = result;
          db.collection("users").find({securityRole: "teacher"}).toArray(function(err, result){
            if(err){
              callback();
              router.bleed(500, null, response, err);
            }
            const teachersList = result;
            if(request.method == "POST"){
              return router.downloadClientPostData(request, function(err, data){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                try{
                  const postData = qs.parse(data);
                  if(/[А-яЁё]/gi.test(postData.allias)){
                    return callback({
                      title: "Изменение дисциплины",
                      discipline: postData,
                      groupsInfo: groupsInfo,
                      userInfo: userInfo,
                      teachersList: teachersList,
                      errorMessage: "Новое имя ссылки(URL) должно быть на английском!"
                    }, "disc_form", 0, 0 );
                  }
                  if(/\/|http|@|:|ftp/gi.test(postData.allias)){
                    return callback({
                      title: "Изменение дисциплины",
                      discipline: postData,
                      groupsInfo: groupsInfo,
                      userInfo: userInfo,
                      teachersList: teachersList,
                      errorMessage: "Неправильное имя ссылки(URL) для дисциплины!"
                    }, "disc_form", 0, 0 );
                  }
                  let editors = [];
                  if(userInfo.securityRole.includes("teacher")){
                    editors = convertToArray(disc_detail.editors);
                  } else{
                      editors = convertToArray(postData.editors);
                  }
                  db.collection("disciplines").findOneAndUpdate({allias: disciplineAllias}, { $set: {
                    name: postData.name,
                    mnemo: postData.mnemo,
                    allias: postData.allias,
                    description: postData.description,
                    groups: convertToArray(postData.groups),
                    dateUpdate: new Date(),
                    lastEditor: userInfo._id,
                    editors: editors
                    }
                  }, function(err, result){
                    if(err){
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if(result.value == null){
                      return callback({
                        title: "Изменение дисциплины",
                        discipline: postData,
                        groupsInfo: groupsInfo,
                        userInfo: userInfo,
                        teachersList: teachersList,
                        errorMessage: "Что-то не так с обновлением, попробуйте снова."
                      }, "disc_form", 0, 0 );
                    }
                    console.log(result);
                    console.log("Discipline updated!");
                    callback();
                    return router.bleed(301, `/disciplines/${postData.allias}/`, response);
                  });
                } catch(err){
                  console.log(`Proccesor error disc_update: ${err}`);
                  callback();
                  return router.bleed(500, null, response, err);
                }
              }, 1024);
            } else{
              return callback({
                title: "Изменение дисциплины",
                discipline: disc_detail,
                groupsInfo: groupsInfo,
                userInfo: userInfo,
                teachersList: teachersList,
                errorMessage: ""
              }, "disc_form", 0, 0);
            }
          });
        });
      });
    });
  }
}
function convertToArray(element){
  if(typeof element === "string"){
    return [element];
  } else{
    return element;
  }
}
