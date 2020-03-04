const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/news\/create\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username: sessionContext.login}, {username:1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response);
      }
      const userInfo = result;
      if(userInfo == null || userInfo.securityRole.length == 0 || (!userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("teacher"))){
        callback();
        return router.bleed(403, null, response);
      }

          if(request.method == "POST"){
            return router.downloadClientPostData(request, function(err, body){
              if(err){
                callback();
                return router.bleed(400, null, response, err);
              }
              try{
                  const postData = qs.parse(body),
                        titleNews = postData.title,
                        newsDescription = postData.short || `${postData.text.substr(0, 115)}...`,
                        textNews = postData.text;

                  if(newsDescription.length > 120){
                    return callback({
                      title: "Создание новости",
                      errorMessage: "Краткое описание не должно превышать 120 символов!"
                    }, "news_create", 0, 0);
                  }
                  db.collection("news").insertOne({
                    title: titleNews,
                    short: newsDescription,
                    text: textNews,
                    url: postData.url,
                    author: userInfo._id.toString(),
                    dateCreate: new Date(),
                    dateUpdate: new Date(),
                    hidden: postData.hidden
                  }, function(err){
                    if(err) router.bleed(500, null, response, err);
                    console.log("News created!");
                    callback();
                    return router.bleed(301, "/news/", response);
                  });
            } catch(err){
              console.log(`Processor error create_news: ${err}`);
              callback();
              return router.bleed(500, null, response, err);
            }
          });
        }else{
          callback({
            title: "Создание новости",
            errorMessage: ""
          }, "news_create", 0, 0);
        }
    });
  }
}
