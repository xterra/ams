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
    if(request.method == "POST"){
      return router.downloadClientPostData(request, function(err, data){
        if(err){
          callback();
          return router.bleed(400, null, response, err);
        }
        try{
          const postData = qs.parse(data);
          let disc_detail = {};
          disc_detail.name = postData.name;
          disc_detail.mnemo = postData.mnemo;
          disc_detail.allias =  postData.allias;
          disc_detail.description = postData.description;
          //TODO: use one pug pattern to update and create form!
          if(disc_detail.name.length == 0 || disc_detail.description.length == 0 || disc_detail.allias.length == 0){
            return callback({
              title: "Create discipline",
              discipline: disc_detail,
              creatorId: postData.creator,
              errorMessage: "Name, allias or description can't be empty!"
            }, "disc_form", 0, 0);
          }
          console.log("allias: " + disc_detail.allias);
          if(/[А-яЁё]/gi.test(disc_detail.allias)){
            return callback({
              title: "Create discipline",
              discipline: disc_detail,
              creatorId: postData.creator,
              errorMessage: "Allias can't exist russian symbols"
            }, "disc_form", 0, 0 );
          }
          db.collection("disciplines").insertOne({
            name: disc_detail.name,
            mnemo: disc_detail.mnemo,
            allias: disc_detail.allias,
            description: disc_detail.description,
            creator: postData.creator,
            dateCreate: new Date(),
            dateUpdate: new Date(),
            lastEditor: postData.creator
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
    }
    db.collection("users").findOne({username : sessionContext.login}, {_id : 1}, function(err, userId){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      callback({
        title: "Create discipline",
        creatorId: userId._id,
        errorMessage: ""
      }, "disc_form", 0, 0);
    })
  }
}
