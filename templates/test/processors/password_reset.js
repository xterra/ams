const router = require("../../../router"),
      qs = require('querystring'),
      security = require("../../../security"),
      md5 = require('md5'),
      ObjectID = require('mongodb').ObjectID,
      cookie = require('cookie');

module.exports = {
  path: new RegExp(/^\/password_reset\/$/),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(404, null, response);
    }
    console.log(JSON.stringify(sessionContext));
    db.collection("users").findOne({_id: new ObjectID(sessionContext.id)}, {username: 1, passwordReset: 1, password: 1}, function(err, forgetfulUser){
      if(err){
        console.error(`Error in password_reset -> find user from user: ${err}`);
        callback();
        return router.bleed(500, null, response, err);
      }
      console.log(JSON.stringify(forgetfulUser));
      if(!forgetfulUser.passwordReset){
        console.log('User not request to reset password... redirecting to not found page');
        callback();
        return router.bleed(404, null, response);
      }
      if(request.method == "POST"){
        router.downloadClientPostData(request, function(err, data){
          if(err){
            return callback({
              title: "Сброс пароля",
              errorMessage: "Плохие данные!"
            }, "password_reset", 0, 0);
          }
          try{
            let postData = qs.parse(data);
            if( postData.newpass1.length < 8){
              return callback({
                title: "Сброс пароля",
                errorMessage: "Новый пароль слишком короткий!"
              }, "password_reset", 0, 0);
            }
            if( postData.newpass1.length > 16){
              return callback({
                title: "Сброс пароля",
                errorMessage: "Новый пароль слишком длинный!"
              }, "password_reset", 0, 0);
            }
            if( postData.newpass1 !==  postData.newpass2){
              return callback({
                title: "Сброс пароля",
                errorMessage: "Новыe пароли не совпадают!"
              }, "password_reset", 0, 0);
            }
            const userNewPass = md5(postData.newpass1);
            if( userNewPass == forgetfulUser.password){
              return callback({
                title: "Сброс пароля",
                errorMessage: "Пароль должен отличаться от старого"
              }, "password_reset", 0, 0);
            }
            db.collection('users').update({_id: new ObjectID(forgetfulUser._id)},
              {$set: {
              password: userNewPass,
              passwordChanged: new Date(),
              passwordReset: false
              },
              $push: {
                passwordChangesHistory: forgetfulUser.password
              }
            }, function(err){
              if(err){
                console.log(`Error with update "${forgetfulUser.username}" password in DB: ${err}`);
                callback();
                return(500, null, response, err);
              }
              console.log(`Password for user "${forgetfulUser.username}"changed`);
              return security.logoutUsingCookies(request, response, function(){
                callback();
                return router.bleed(301, `/login/`, response);
              });
            });
          } catch(err){
            console.log(`Error in password_reset -> POST in try: ${err}`);
            return callback({
              title: "Сброс пароля",
              errorMessage: "Плохие данные. Попробуйте снова или обратитесь к администратору!"
            }, "password_reset", 0, 0);
          }
        });
      }else{
        return callback({
          title: "Сброс пароля",
          errorMessage: ""
        }, "password_reset", 0, 0);
      }

    });
  }
}
