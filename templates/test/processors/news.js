
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
      let sessionLogin = "John Doe";
      if(sessionContext !== undefined && sessionContext !== null && "login" in sessionContext){
        sessionLogin = sessionContext.login;
      }
      callback({
        news: news,
        sessionLogin: sessionLogin
      }, "news", 0, 0);
    });
  }
}
