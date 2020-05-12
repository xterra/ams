const md5 = require("md5"),
      router = require('../../../router'),
      qs = require('querystring'),
      ObjectID = require('mongodb').ObjectID
module.exports = {
  path: new RegExp("^\/profiles\/new\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({_id: sessionContext.id}, {username: 1, securityRole: 1}, function(err, user){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      let userInfo = user;
      if(userNotAdmin(userInfo.securityRole)){
        callback();
        return router.bleed(403, null, response);
      }
      function userNotAdmin(securityRole){
        return securityRole.includes('superadmin') ? false : true;
      }
      db.collection("groups").find({}, {fullname: 1, url: 1}).toArray(function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        const groups = result;

        if(request.method == "POST"){
          router.downloadClientPostData(request, function(err, data){
            if(err){
              callback();
              return router.bleed(400, null, response);
            }
            const postData = qs.parse(data);
            const messageCheckUsernameLength = checkUsernameLength(postData.username);
            if(messageCheckUsernameLength){
              return callback({
                title: "Новый профиль",
                profileInfo: postData,
                userInfo: userInfo,
                groups: groups,
                errorMessage: messageCheckUsernameLength
              }, "profile_form", 0, 0);
            }
            return db.collection("users").findOne({username: postData.username}, {_id:1}, null, function(err, foundUser){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              if(foundUser){
                return callback({
                  title: "Новый профиль",
                  profileInfo: postData,
                  userInfo: userInfo,
                  groups: groups,
                  errorMessage: "Такой логин уже существует!"
                }, "profile_form", 0, 0);
              }
              createUserInDb(db, postData, function(err, result){
                if (!err) {
                  console.log(`User created with id: ${result.insertedId}`);
                  callback();
                  return router.bleed(301, `/profiles/reset/${result.insertedId}/`, response);
                }
                if(result.result.ok === 1) {
                  return callback({
                    title: "Новый профиль",
                    profileInfo: postData,
                    userInfo: userInfo,
                    groups: groups,
                    errorMessage: "Пользователь не создан... Попробуйте ещё раз!"
                  }, "profile_form", 0, 0);
                } else {
                    callback();
                    return router.bleed(500, null, response, new Error("Unknown problem: db insert is non-ok"));
                }
              })
            });
          }, 10000000);
        } else{
            return callback({
              title: "Новый профиль",
              userInfo: userInfo,
              groups: groups,
              errorMessage: ""
            }, "profile_form", 0, 0);
        }
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

function createUserInDb(db, postData, callback){
  let positionOrGroupKey = getPositionOrGroupKey(postData.securityRole);

  if(positionOrGroupKey == "group") postData.group = new ObjectID(postData.group);

  db.collection("users").insertOne({
    email: postData.email,
    phone: postData.phone,
    lastName: postData.lastName,
    name: postData.name,
    fatherName: postData.fatherName,
    username: postData.username,
    password: '',
    accountCreated: new Date(),
    passwordChanged: new Date(),
    passwordChangesHistory: [],
    [positionOrGroupKey]: postData[positionOrGroupKey],
    loginHistory: [],
    bannedTill: null,
    bannedReason: null,
    securityGrants: [],
    securityRole: [postData.securityRole],
    personalDataUsageAgreed: new Date(),
    accountActivated: new Date(),
    passwordReset: true
  }, null, function(err, result){
    return callback(err, result);
  });
}

function getPositionOrGroupKey(securityRole){
  return securityRole.includes("student") ? "group" : "position";
}
