
module.exports = {
  path: new RegExp("^\/contacts\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Контакты",
        user: null
      }, "contacts", 5, 5);
    } else{
      callback({
        title: "Контакты",
        user: sessionContext.login
      }, "contacts", 5, 5);
    }

  }
}
