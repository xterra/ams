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
                    groupsInfo: groupsInfo,
                    teachersList: teachersList,
                    userInfo: userInfo,
                    errorMessage: " Имя ссылки(URL) должно быть на английском!"
                  }, "disc_form", 0, 0 );
                }
                if(/\/|http|@|:|ftp/gi.test(postData.allias)){
                  return callback({
                    title: "Новая дисциплина",
                    discipline: postData,
                    groupsInfo: groupsInfo,
                    userInfo: userInfo,
                    teachersList: teachersList,
                    errorMessage: "Неправильное имя ссылки(URL) для дисциплины!"
                  }, "disc_form", 0, 0 );
                }
                let editors = [];
                if(userInfo.securityRole.includes("teacher")){
                  editors.push(userInfo._id.toString());
                } else{
                  editors = convertToArray(postData.editors);
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
                  editors: editors,
                  groups: convertToArray(postData.groups),
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
              groupsInfo: groupsInfo,
              teachersList: teachersList,
              userInfo: userInfo,
              errorMessage: ""
            }, "disc_form", 0, 0);
          }
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
