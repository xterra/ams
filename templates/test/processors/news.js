
module.exports = {
  path: new RegExp("^\/news$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db ) {
    console.log(sessionContext);
    db.collection("news").find().toArray(function(err, result){
      if(err) {
        callback();
        bleed(500, null, response, err);
      }
      const newsInstances = result;
      console.log(newsInstances);
      let sessionLogin = "John Doe";
      if(sessionContext !== undefined && sessionContext !== null && "login" in sessionContext){
        sessionLogin = sessionContext.login;
      }
      callback({
        newsInstances: newsInstances,
        sessionLogin: sessionLogin
      }, "news", 0, 0);
    });
  }
}
