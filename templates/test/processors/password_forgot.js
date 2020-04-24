const router = require("../../../router"),
      qs = require('querystring'),
      security = require("../../../security"),
      nodemailer = require('nodemailer');
module.exports = {
  path: new RegExp(/^\/password_forgot\/$/),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    getUserBySessionContext(sessionContext, db, function(err, userInfo) {
      if(err){
        return callback();
        router.bleed(500, null, response, err);
      }
      if(request.method == "POST"){
        router.downloadClientPostData(request, function(err, data) {
          if(err){
            return callback({
              title: "Забыл пароль",
              userInfo: userInfo,
              errorMessage: "Плохие данные. Попробуйте ввести форму снова."
            }, "password_forgot", 0, 0);
          }
          try{
            let postData = qs.parse(data);
            db.collection("users").findOne({username: postData.username}, {username: 1, email: 1, securityRole: 1}, function(err, result){
              if(err){
                console.error(`Error in password_forgot -> search user from DB: ${err}`);
                callback();
                return router.bleed(500, null, response, err);
              }
              if(result == null){
                return callback({
                  title: "Забыл пароль",
                  userInfo: userInfo,
                  errorMessage: "Пользователь не найден"
                }, "password_forgot", 0, 0);
              }
              let forgetfulUser = result;
              let mailCheckRegExp = new RegExp(/^.+@.{2,}\..{2,}$/igm);
              if(forgetfulUser.email == '' || !mailCheckRegExp.test(forgetfulUser.email)){
                return callback({
                  title: "Забыл пароль",
                  userInfo: userInfo,
                  errorMessage: "Неправильная почта. Для сброса - обратитесь к администратору."
                }, "password_forgot", 0, 0);
              }
              security.makeSession(forgetfulUser._id, function(err, token, sessionData){
                if(err){
                  console.error(`Error in password_forgot -> security.makeSession: ${err}`);
                  callback();
                  return router.bleed(500, null, response, err);
                }
                let smtpTransport;
                try{
                  smtpTransport = nodemailer.createTransport({
                    host: 'smtp.yandex.ru',
                    port: 465,
                    secure: true,
                    auth:{
                      user: "no-reply@miitasu.ru",
                      pass: "guRcIXiC#jLS"
                    }
                  });
                }catch(err){
                  return console.log('Error: ' + e.name + ":" + e.message);
                }

                let mailOptions = {
                  from: "no-reply@miitasu.ru",
                  to: forgetfulUser.email,
                  subject: 'Сброс пароля для сайта miitasu.ru',
                  text: `Вы запросили сброс пароля для сайта miitasu.ru \n Персональная ссылка для сброса пароля: https://miitasu.ru/password_reset/${token}/ \n Если Вы не запрашивали сброс пароля - проигнорируйте данное сообщение.`,
                  html: `<h2>Вы запросили сброс пароля для сайта miitasu.ru</h2> </br> <p>Персональная ссылка для сброса пароля:</p> </br> <p><a href=https://miitasu.ru/password_reset/${token}/ > Ссылка для сброса пароля</a></p>  </br> <p>Если Вы не запрашивали сброс пароля - <b> проигнорируйте</b> данное сообщение.</p>`
                };
                smtpTransport.sendMail(mailOptions, (err, info) =>{
                  if(err){
                    console.log(err);
                    return callback({
                      title: "Забыл пароль",
                      userInfo: userInfo,
                      errorMessage: "Ошибка отправки, попробуйте позже!"
                    }, 'password_forgot', 0, 0);
                  } else{
                    console.log('Message sent: %s', info.messageId);
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    return callback({
                      title: "Забыл пароль",
                      userInfo: userInfo,
                      success: `Ссылка для сброса пароля отправлена по адресу: "${forgetfulUser.email}"`,
                      errorMessage: ""
                    }, 'password_forgot', 0, 0);
                  }
                });
              });
            });
          }catch(err){
            console.log(`Error in password_forgot -> POST in try: ${err}`);
            return callback({
              title: "Забыл пароль",
              userInfo: userInfo,
              errorMessage: "Плохие данные. Попробуйте снова или обратитесь к администратору!"
            }, "password_password", 0, 0);
          }
        });
      }else{
        return callback({
          title: "Забыл пароль",
          userInfo: userInfo,
          errorMessage: ""
        }, "password_forgot", 0, 0);
      }
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
