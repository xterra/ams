
module.exports = {
  path: new RegExp("^\/contacts\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Контакты",
        userAthorized: false
      }, "contacts", 5, 5);
    } else{
      callback({
        title: "Контакты",
        userAthorized: true
      }, "contacts", 5, 5);
    }

  }
}
