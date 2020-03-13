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

    if(request.method == "POST"){
      return router.downloadClientPostData(request, function(err, data){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        try{
          let disc_detail = {};
          const postData = qs.parse(data);
          disc_detail.name = postData.name;
          disc_detail.mnemo = postData.mnemo;
          disc_detail.allias =  postData.allias;
          disc_detail.description = postData.description;
          if(/[А-яЁё]/gi.test(disc_detail.allias)){
            return callback({
              title: "Изменение дисциплины",
              discipline: disc_detail,
              errorMessage: "Новое имя ссылки должно быть на английском!"
            }, "disc_form", 0, 0 );
          }
          db.collection("disciplines").findOneAndUpdate({allias: disciplineAllias}, { $set: {
            name: disc_detail.name,
            mnemo: disc_detail.mnemo,
            allias: disc_detail.allias,
            description: disc_detail.description,
            dateUpdate: new Date(),
            lastEditor: postData.creator
            }
          }, function(err, result){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            if(result.value == null){
              return callback({
                title: "Изменение дисциплины",
                discipline: disc_detail,
                errorMessage: "Что-то не так с обновлением, попробуйте снова."
              }, "disc_form", 0, 0 );
            }
            console.log(result);
            console.log("Discipline updated!");
            callback();
            return router.bleed(301, `/disciplines/${disc_detail.allias}/`, response);
          });
        } catch(err){
          console.log(`Proccesor error disc_update: ${err}`);
          callback();
          return router.bleed(500, null, response, err);
        }
      }, 1024);
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
      return   db.collection("users").findOne({username : sessionContext.login}, {_id : 1}, function(err, userId){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
        callback({
          title: "Изменение дисциплины",
          errorMessage: "",
          creatorId: userId._id,
          discipline: disc_detail
        }, "disc_form", 0, 0);
      });
    });
  }
}