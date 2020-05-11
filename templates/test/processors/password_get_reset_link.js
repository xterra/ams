const router = require("../../../router"),
      ObjectID = require('mongodb').ObjectID,
      security = require("../../../security");
module.exports = {
  path: new RegExp("^\/profiles\/reset\/[^\/]{24,}\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    getUserBySessionContext(sessionContext, db, function(err, user){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(user.securityRole == undefined || !user.securityRole.includes('superadmin')){
        console.log(`Check admin ${user}`);
        callback();
        return router.bleed(404, null, response);
      }
      let adminInfo = user;
      const requestedUrl = decodeURI(request.url);
      const forgetfulUserId = requestedUrl.match(/[^\/]{24,}/g)[0];
      console.log(`forgetfulUserId: ${forgetfulUserId}`)
      db.collection("users").findOne({_id: new ObjectID(forgetfulUserId)}, {username: 1, name: 1, fatherName: 1, lastName: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          console.log(`Check forgetfulUser: ${result}`);
          callback();
          return router.bleed(404, null, response);
        }
        let forgetfulUser = result;
        security.makeSession(forgetfulUser._id, function(err, token, sessionData){
          if(err){
            console.error(`Error in password_forgot -> security.makeSession: ${err}`);
            callback();
            return router.bleed(500, null, response, err);
          }
          db.collection("users").updateOne({_id: forgetfulUser._id}, {$set: {passwordReset: true}}, function(err, result){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            console.log(result);
            return callback({
              title: "Сброс пароля",
              adminInfo: adminInfo,
              forgetfulUser: forgetfulUser,
              token: token
            }, "password_get_reset_link", 0, 0)
          });
        });
      });
    });
  }
}

function getUserBySessionContext(sessionContext, db, callback){
  if(sessionContext == null || !sessionContext.hasOwnProperty('id')){
    return callback(null, null);
  } else{
    db.collection("users").findOne({_id: sessionContext.id}, {username:1 ,securityRole: 1}, function(err, result){
      if(err){
        console.error(`Error in password_forgot -> getUserBySessionContext: ${err}`);
        return callback(err, null);
      }
      if(result == null){
        return callback(null, null);
      }
      console.log(result);
      return callback(null, result);
    });
  }
}
