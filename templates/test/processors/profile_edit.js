const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID,
      qs = require('querystring');

module.exports = {
  path: new RegExp("^\/profiles\/edit\/[^\/]{24,}\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(userNotAuthed()){
      callback();
      return router.bleed(301, "/login/", response);
    }
    function userNotAuthed(){
      if (sessionToken == null || sessionContext == undefined || sessionContext == null) return true;
      return false;
    }

    db.collection("users").findOne({_id: new ObjectID(sessionContext.id)}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const requestedUrl = decodeURI(request.url);
      if(result == null){
        callback();
        return router.bleed(400, requestedUrl, response);
      }

      let userInfo = result;
      let profileId = requestedUrl.match(/[^\/]{24,}/g)[0];
      console.log(`profileId: ${profileId} vs userInfo.id: ${userInfo._id} - ${profileId == userInfo._id}`);
      if( userNotOwnerProfile() && userNotAdmin(userInfo.securityRole)) {
        callback();
        return router.bleed(403, null, response);
      }
      function userNotOwnerProfile(){
       return profileId == userInfo._id ? false : true;
      }
      function userNotAdmin(securityRole){
        return securityRole.includes('superadmin') ? false : true;
      }

      db.collection("users").findOne({_id: new ObjectID(profileId)}, {
        email: 1,
        phone: 1,
        name: 1,
        lastName : 1,
        fatherName : 1,
        username : 1,
        securityRole: 1,
        group : 1,
        position : 1
      }, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(400, requestedUrl, response);
        }
        let profileInfo = result;
        console.log(`\n Profile edit - profileInfo.securityRole: ${profileInfo.securityRole} \n`);
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
                const updatedProfileData = getUpdatesForProfile();
                function getUpdatesForProfile(){
                  if(userNotAdmin(userInfo.securityRole)){
                    return updateAdditionalDataFromProfile()
                  }
                  return updateAllDataFromProfile();
                }
                function updateAdditionalDataFromProfile(){
                  let newProfileData = profileInfo;
                  newProfileData.email = postData.email;
                  newProfileData.phone = postData.phone;

                  const positionOrGroupKey = getPositionOrGroupKey(profileInfo.securityRole);
                  if(positionOrGroupKey == "group") newProfileData.group = new ObjectID(profileInfo.group);

                  return newProfileData;
                }
                function updateAllDataFromProfile(){
                  let newProfileData = profileInfo;
                  newProfileData.email = postData.email;
                  newProfileData.phone = postData.phone;
                  newProfileData.lastName = postData.lastName;
                  newProfileData.name = postData.name;
                  newProfileData.fatherName = postData.fatherName;
                  newProfileData.username = postData.username;
                  newProfileData.securityRole = [postData.securityRole];
                  let positionOrGroupKey = getPositionOrGroupKey(newProfileData.securityRole);

                  if(positionOrGroupKey == "group") {
                    newProfileData.group = new ObjectID(postData.group);
                  }else{
                    newProfileData.position = postData.position;
                  }
                  return newProfileData;
                }
                //TODO: Add mail checking

                function getPositionOrGroupKey(securityRole){
                  return securityRole.includes("student") ? "group" : "position";
                }

                if(updatedProfileData.username !== profileInfo.username){
                  const messageCheckUsernameLength = checkUsernameLength(updatedProfileData.username);
                  if(messageCheckUsernameLength){
                    return callback({
                      title: "Изменение профиля",
                      userInfo: userInfo,
                      profileInfo: profileInfo,
                      groups: groups,
                      errorMessage: messageCheckUsernameLength
                    }, "profile_form", 0, 0);
                  }
                  return db.collection("users").findOne({username: updatedProfileData.username}, {_id:1}, null, function(err, foundUser){
                    if(err){
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if(foundUser){
                      return callback({
                        title: "Изменение профиля",
                        userInfo: userInfo,
                        profileInfo: profileInfo,
                        groups: groups,
                        errorMessage: "Такой пользователь уже существует!"
                      }, "profile_form", 0, 0);
                    }else{
                      db.collection("users").update({_id: profileInfo._id}, {$set: updatedProfileData}, function(err){
                        if(err){
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        if(updatedProfileData.username == profileInfo.username){
                          callback();
                          return router.bleed(301, `/profiles/${profileInfo._id}/`, response);
                        } else{
                          return db.collection("users").update({_id: profileInfo._id}, {$push: {loginHistory: profileInfo.username}}, function(err){
                            if(err) {
                              console.log(`Error in update login ${profileInfo.username}`);
                              callback();
                              return router.bleed(500, null, response, err);
                            }
                            callback();
                            return router.bleed(301, `/profiles/${profileInfo._id}/`, response);
                          });
                        }
                      });
                    }
                  });
                }
                else {
                      db.collection("users").update({_id: profileInfo._id}, {$set: updatedProfileData}, function(err){
                        if(err){
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        if(updatedProfileData.username == profileInfo.username){
                          callback();
                          return router.bleed(301, `/profiles/${profileInfo._id}/`, response);
                        } else{
                          return db.collection("users").update({_id: profileInfo._id}, {$push: {loginHistory: profileInfo.username}}, function(err){
                            if(err) {
                              console.log(`Error in update login ${profileInfo.username}`);
                              callback();
                              return router.bleed(500, null, response, err);
                            }
                            callback();
                            return router.bleed(301, `/profiles/${profileInfo._id}/`, response);
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
              userInfo: userInfo,
              profileInfo: profileInfo,
              groups: groups,
              errorMessage: ""
            }, "profile_form", 0, 0)
          }
        });
      });
    });
  }
}

function checkUsernameLength(username){
  let loginTooSmall = "Логин слишком короткий";
  if(username.length < 5) return loginTooSmall;
  let loginTooLong = "Логин слишком длинный";
  if(username.length > 16) return loginTooLong;
  return ""
}
