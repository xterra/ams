const router = require('../../../router');


module.exports = {
  path: new RegExp("^\/about\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "О нас",
        userAthorized: false
      }, "about", 5, 5);
    } else{
      callback({
        title: "О нас",
        userAthorized: true
      }, "about", 5, 5);
    }
  }
}
