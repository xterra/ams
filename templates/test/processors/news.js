
module.exports = {
  path: new RegExp("^\/news\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db ) {
    console.log(sessionContext);
    db.collection("news").find().toArray(function(err, result){
      if(err) {
        callback();
        bleed(500, null, response, err);
      }
      const news = result;
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Новости",
        news: news,
        user: null
      }, "news", 5, 5);
    } else{
      callback({
        title: "Новости",
        news: news,
        user: sessionContext.login
      }, "news", 5, 5);
    }
    });
  }
}
