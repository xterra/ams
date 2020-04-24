const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/news\/delete\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    const requsetedURL = decodeURI(request.url);
    const delimeteredURL = requsetedURL.split("/");
    const newsUrl = delimeteredURL[delimeteredURL.length - 2];
    db.collection("users").findOne({_id: sessionContext.id},{username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return  router.bleed(500, null, response);
      }
      if(result == null){
        callback();
        return router.bleed(301, "/login/", response);
      }
      const userInfo = result;
      db.collection("news").findOne({url: newsUrl},{url: 1, title: 1, author: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(404, requsetedURL, response);
        }
        let news_detail = result;
        if(userInfo.securityRole.length == 0 || (!userInfo.securityRole.includes("superadmin") && userInfo._id.toString() !== news_detail.author)){
          callback();
          return router.bleed(403, null, response);
        }
        if(request.method == "POST"){
          db.collection("news").deleteOne({_id: new ObjectID(news_detail._id)}, function(err){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            callback();
            console.log(`News "${newsUrl}" deleted!`);
            return router.bleed(301, "/news/", response);
          });
        } else{
          return callback({
            title: "Удаление новости",
            news_detail: news_detail
          }, "news_delete", 0, 0);
        }
      });
    });
  }
}
