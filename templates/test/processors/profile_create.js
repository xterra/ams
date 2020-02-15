const md5 = require("md5"),
      router = require('../../../router'),
      qs = require('querystring');
module.exports = {
  path: new RegExp("^\/profiles\/new\/$"),
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
      let adminInfo = result;
      if(adminInfo.securityRole.length == 0 || !adminInfo.securityRole.includes("superadmin")){
        callback();
        return router.bleed(403, null, response);
      }
      if(request.method == "POST"){
        router.downloadClientPostData(request, function(err, data){
          if(err){
            callback();
            return router.bleed(400, null, response);
          }
          const postData = qs.parse(data);
          if(postData.username.length < 5 || postData.password.length < 8){
            return callback({
              title: "Новый профиль",
              adminName: adminInfo.username,
              userInfo: postData,
              errorMessage: "Логин или пароль короткие!"
            }, "profile_create", 0, 0);
          }

          if(postData.username.length > 16 || postData.password.length > 64){
            return callback({
              title: "Новый профиль",
              adminName: adminInfo.username,
              userInfo: postData,
              errorMessage: "Логин или пароль слишком длинные!"
            }, "profile_create", 0, 0);
          }
          const cryptoPass = md5(postData.password);
          return db.collection("users").findOne({username: postData.username}, {_id:1}, null, function(err, foundUser){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            if(foundUser){
              return callback({
                title: "Новый профиль",
                adminName: adminInfo.username,
                userInfo: postData,
                errorMessage: "Такой пользователь уже существует!"
              }, "profile_create", 0, 0);
            }else{
              db.collection("users").insertOne({
                email: postData.email,
                phone: postData.phone,
                lastName: postData.lastname,
                name: postData.name,
                fatherName: postData.fatherName,
                username: postData.username,
                password: cryptoPass,
                accountCreated: new Date(),
                passwordChanged: new Date(),
                passwordChangesHistory: [],
                loginHistory: [],
                bannedTill: null,
                bannedReason: null,
                securityGrants: [],
                securityRole: [postData.securityRole],
                personalDataUsageAgreed: new Date(),
                accountActivated: new Date()
              }, null, function(err, result){ //TODO:ПЕРЕДЕЛАТЬ!!!
                if (!err) {
                  console.log(`User created with id: ${result.insertedId}`);
                  callback();
                  return router.bleed(301, "/profiles/", response);
                } else {
                    if(result.result.ok === 1) {
                      return callback({
                        title: "Новый профиль",
                        adminName: adminInfo.username,
                        userInfo: postData,
                        errorMessage: "Пользователь не создан... Попробуйте ещё раз!"
                      }, "profile_create", 0, 0);
                    } else {
                        callback();
                        return router.bleed(500, null, response, new Error("Unknown problem: db insert is non-ok"));
                    }
                }
                callback();
                return router.bleed(500, null, response, err);
              });
            }
          });
        });
      } else{
          return callback({
            title: "Новый профиль",
            adminName: adminInfo.username,
            userInfo: {},
            errorMessage: ""
          }, "profile_create", 0, 0);
      }
    });
  }
}
