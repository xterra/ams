const router = require('../../../router'),
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp("^\/news\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    const requsetedURL = decodeURI(request.url);
    const delimeteredURL = requsetedURL.split("/");
    const newsUrl = delimeteredURL[delimeteredURL.length - 2];

    db.collection("news").findOne({url: newsUrl}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        return router.bleed(404, requsetedURL, response);
      }
      let news_detail = result;
            news_detail.formatedDate = beautyDate(news_detail.dateUpdate);
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
        callback({
          title: "Новость",
          news_detail: news_detail,
          userInfo: null
        }, "news_detail", 5, 5);
      } else{
        db.collection("users").findOne({_id: sessionContext.id}, {username:1, securityRole: 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response);
          }
          if(result == null){
            callback();
            return router.bleed(404, null, response);
          }
          let userInfo = result;
          return callback({
            title: "Новость",
            news_detail: news_detail,
            userInfo: userInfo
          }, "news_detail", 0, 0);
        });
      }
    });

  }
}
