const md5 = require('md5'),
      router = require('../../../router')
      qs = require('querystring'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/profiles\/change\/[^\/]{24,}\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    const requestedUrl = decodeURI(request.url);
    let userId = requestedUrl.match(/[^\/]{24,}/g)[0];
    db.collection("users").findOne({_id: new ObjectID(userId)}, {_id: 1, password: 1, username: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        return router.bleed(400, null, response);
      }
      let userFromDB = result;
      console.log(`${userId} VS ${userFromDB._id}`);
      if(userId.toString() !== sessionContext.id.toString()){
        callback();
        return router.bleed(403, null, response);
      } else{
        if(request.method == "POST"){
          router.downloadClientPostData(request, function(err, data){
            if(err){
              return callback({
                title: "Смена пароля",
                userId: userFromDB._id.toString(),
                errorMessage: "Плохие данные!"
              }, "password_change", 0, 0);
            }
            try{
              const postData = qs.parse(data);
              const userOldPass = md5(postData.oldpass);
              if( userOldPass !== userFromDB.password){
                return callback({
                  title: "Смена пароля",
                  userId: userFromDB._id.toString(),
                  errorMessage: "Старый пароль введён неправильно!"
                }, "password_change", 0, 0);
              }
              if( postData.newpass1.length < 8){
                return callback({
                  title: "Смена пароля",
                  userId: userFromDB._id.toString(),
                  errorMessage: "Новый пароль слишком короткий!"
                }, "password_change", 0, 0);
              }
              if( postData.newpass1.length > 16){
                return callback({
                  title: "Смена пароля",
                  userId: userFromDB._id.toString(),
                  errorMessage: "Новый пароль слишком длинный!"
                }, "password_change", 0, 0);
              }

              if( postData.newpass1 !==  postData.newpass2){
                return callback({
                  title: "Смена пароля",
                  userId: userFromDB._id.toString(),
                  errorMessage: "Новыe пароли не совпадают!"
                }, "password_change", 0, 0);
              }
              const userNewPass = md5(postData.newpass1);
              db.collection('users').update({_id: userFromDB._id},
                {$set: {
                password: userNewPass,
                passwordChanged: new Date()
                },
                $push: {
                  passwordChangesHistory: userOldPass
                }
              }, function(err){
                if(err){
                  console.log(`Error with update "${userFromDB.username}" password in DB: ${err}`);
                  callback();
                  return(500, null, response, err);
                }
                console.log(`Password for user "${userFromDB.username}"changed`);
                callback();
                return router.bleed(301, `/profiles/${userFromDB._id}/`, response);
              });
            }catch(err){
              console.log(`Error in password_change -> POST in try: ${err}`);
              return callback({
                title: "Смена пароля",
                userId: userFromDB._id.toString(),
                errorMessage: "Плохие данные. Попробуйте снова или обратитесь к администратору!"
              }, "password_change", 0, 0);
            }
          });
        }else{
          return callback({
            title: "Смена пароля",
            userId: userFromDB._id.toString(),
            errorMessage: ""
          }, "password_change", 0, 0);
        }
      }
    });
  }
}
