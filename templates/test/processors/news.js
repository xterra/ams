const router = require('../../../router'),
      beautyDate = require('../../../beautyDate');
module.exports = {
  path: new RegExp("^\/news\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db ) {
    console.log(sessionContext);
    db.collection("news").find().sort({dateUpdate: -1}).toArray(function(err, result){
      if(err) {
        callback();
        return router.bleed(500, null, response, err);
      }
      const news = result;
      for (let pieceOfNews in news){
        news[`${pieceOfNews}`].formatedDate = beautyDate(news[pieceOfNews].dateUpdate);
      }
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Новости",
        news: news,
        userInfo: null
      }, "news", 5, 5);
    } else{
        db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          let user = result;
          return callback({
            title: "Новости",
            news: news,
            userInfo: user
          }, "news", 5, 5);
        });
      }
    });
  }
}
