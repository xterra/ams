const router = require('../../../router'),
      qs = require('querystring'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/groups\/edit\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    let requestedUrl = decodeURI(request.url);
    let delimeteredUrl = requestedUrl.split('/');
    let groupURL = delimeteredUrl[delimeteredUrl.length-2];
    db.collection("users").findOne({_id: sessionContext.id}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 && !userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("admin")){
        callback();
        return router.bleed(403, null, response);
      }
      db.collection("groups").findOne({url: groupURL}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(404, requestedUrl, response);
        }
        const groupInfo = result;
        console.log(groupInfo);
        db.collection("users").find({group: groupInfo._id}, {lastName: 1, name: 1}).toArray(function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, bleed);
          }
          console.log(result);
          const groupList = result;
          if(request.method == "POST"){
            router.downloadClientPostData(request, function(err, data){
              if(err){
                callback();
                return router.bleed(400, null, response);
              }

              try {
                const postData = qs.parse(data);
                console.log(postData);
                if(/[А-яЁё]/gi.test(postData.url)){
                  return callback({
                    title: "Изменение группы",
                    groupInfo: postData,
                    errorMessage: "Имя группы для ссылки должно быть на английском!"
                  }, "groups_form", 0, 0 );
                }

                if( groupURL !== postData.url){
                  db.collection("groups").findOne({url: postData.url}, {_id: 1}, function(err, foundGroup){
                    if(err){
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if(foundGroup){
                      return callback({
                        title: "Изменение группы",
                        groupInfo: postData,
                        errorMessage: "Группа с таким URL уже существует!"
                      }, "groups_form", 0, 0);
                    } else{
                      db.collection("groups").findOneAndUpdate({url: postData.url},
                        {$set: {
                        name: postData.name,
                        course: postData.course,
                        fullname: postData.fullname,
                        url: postData.url,
                        typeEducation: postData.typeEducation,
                        elder: new ObjectID(postData.elder)
                      } },function(err){
                        if(err) {
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        console.log(`Group ${groupURL} info changed!`);
                        callback();
                        return router.bleed(301, "/groups/", response);
                      });
                    }
                  });
                } else{
                  db.collection("groups").findOneAndUpdate({url: postData.url},
                    {$set: {
                    name: postData.name,
                    course: postData.course,
                    fullname: postData.fullname,
                    url: postData.url,
                    typeEducation: postData.typeEducation,
                    elder: new ObjectID(postData.elder)
                  } },function(err){
                    if(err) {
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    console.log(`Group ${groupURL} info changed!`);
                    callback();
                    return router.bleed(301, "/groups/", response);
                  });
                }
              } catch (err) {
                console.log(`Processor error groups_edit: ${err}`);
                callback();
                return router.bleed(500, null, response, err);
              }
            });
          }else{
            return callback({
              title: "Изменение группы",
              groupInfo: groupInfo,
              groupList: groupList,
              errorMessage: ""
            }, "groups_form", 0, 0);
          }
        });
      });
    });
  }
}

function updateGroup(postData, callback){
  db.collection("groups").findOneAndUpdate({_id: postData._id},
    {$set: {
    name: postData.name,
    course: postData.course,
    fullname: postData.fullname,
    url: postData.url,
    typeEducation: postData.typeEducation,
    elder: postData.elder
  } },function(err){
    if(err) {
      return callback(err);
    }
    console.log(`Group ${groupURL} info changed!`);
    return callback(null);
  });
}
