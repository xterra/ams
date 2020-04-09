const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID,
      qs = require('querystring');

module.exports = {
  path: new RegExp("^\/profiles\/edit\/[^\/]{24,}\/$"),
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
      const requestedUrl = decodeURI(request.url);
      if(result == null){
        callback();
        return router.bleed(400, requestedUrl, response);
      }
      let adminInfo = result;
      let userId = requestedUrl.match(/[^\/]{24,}/g)[0];
      if( userId !== adminInfo._id && (adminInfo.securityRole.length == 0 || !adminInfo.securityRole.includes('superadmin'))) {
        callback();
        return router.bleed(403, null, response);
      }
      db.collection("users").findOne({_id: new ObjectID(userId)}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(400, requestedUrl, response);
        }
        let userInfo = result;
        db.collection("groups").find({}, {fullname: 1, url: 1}).toArray(function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          const groups = result;
          if(request.method == "POST"){
            return router.downloadClientPostData(request, function(err, data){
              if(err){
                callback();
                return router.bleed(400, null, response, err);
              }
              try{
                let postData = qs.parse(data);
                if(postData.username.length < 5){
                  return callback({
                    title: "Изменение профиля",
                    adminInfo: adminInfo,
                    userInfo: userInfo,
                    groups: groups,
                    errorMessage: "Логин слишком короткий!"
                  }, "profile_edit", 0, 0);
                }
                if(postData.username.length > 16){
                  return callback({
                    title: "Изменение профиля",
                    adminInfo: adminInfo,
                    userInfo: userInfo,
                    groups: groups,
                    errorMessage: "Логин слишком длинный!"
                  }, "profile_edit", 0, 0);
                }
                let positionOrGroupKey,
                    positionOrGroupValue;
                if(postData.securityRole == "student"){
                  positionOrGroupKey = "group";
                  positionOrGroupValue = new ObjectID(postData.group);
                } else{
                  positionOrGroupKey = "position";
                  positionOrGroupValue = postData.position;
                }
                if(postData.username !== userInfo.username){
                  return db.collection("users").findOne({username: postData.username}, {_id:1}, null, function(err, foundUser){
                    if(err){
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if(foundUser){
                      return callback({
                        title: "Изменение профиля",
                        adminInfo: adminInfo,
                        userInfo: userInfo,
                        groups: groups,
                        errorMessage: "Такой пользователь уже существует!"
                      }, "profile_edit", 0, 0);
                    }else{
                      db.collection("users").findOneAndUpdate({_id: userInfo._id}, {$set: {
                        email: postData.email,
                        phone: postData.phone,
                        lastName: postData.lastname,
                        name: postData.name,
                        fatherName: postData.fathername,
                        username: postData.username,
                        securityRole: [postData.securityRole],
                        [positionOrGroupKey]: positionOrGroupValue
                      }}, function(err){
                        if(err){
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        if(postData.username == userInfo.username){
                          callback();
                          return router.bleed(301, `/profiles/${userInfo._id}/`, response);
                        } else{
                          return db.collection("users").update({_id: userInfo._id}, {$push: {loginHistory: userInfo.username}}, function(err){
                            if(err) {
                              console.log(`Error in update login ${userInfo.username}`);
                              callback();
                              return router.bleed(500, null, response, err);
                            }
                            callback();
                            return router.bleed(301, `/profiles/${userInfo._id}/`, response);
                          });
                        }
                      });
                    }
                  });
                }
                else {
                      db.collection("users").findOneAndUpdate({_id: userInfo._id}, {$set: {
                      email: postData.email,
                      phone: postData.phone,
                      lastName: postData.lastname,
                      name: postData.name,
                      fatherName: postData.fathername,
                      username: postData.username,
                      securityRole: [postData.securityRole],
                      [positionOrGroupKey]: positionOrGroupValue
                      }}, function(err){
                        if(err){
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        if(postData.username == userInfo.username){
                          callback();
                          return router.bleed(301, `/profiles/${userInfo._id}/`, response);
                        } else{
                          return db.collection("users").update({_id: userInfo._id}, {$push: {loginHistory: userInfo.username}}, function(err){
                            if(err) {
                              console.log(`Error in update login ${userInfo.username}`);
                              callback();
                              return router.bleed(500, null, response, err);
                            }
                            callback();
                            return router.bleed(301, `/profiles/${userInfo._id}/`, response);
                          });
                        }
                    });
                }
              }catch(err){
                console.log(`Error in profile_edit -> POST in try{}`);
                callback();
                return router.bleed(500, null, response, err);
              }
            }, 10000000);
          } else{
            return callback({
              title: "Изменение профиля",
              adminInfo: adminInfo,
              userInfo: userInfo,
              groups: groups,
              errorMessage: ""
            }, "profile_edit", 0, 0)
          }
        });
      });
    });
  }
}
