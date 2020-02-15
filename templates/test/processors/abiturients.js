const router = require('../../../router');


module.exports = {
  path: new RegExp("^\/for-abiturients\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Абитуриентам",
        user: null
      }, "abiturients", 5, 5);
    } else{
      callback({
        title: "Абитуриентам",
        user: sessionContext.login
      }, "abiturients", 5, 5);
    }
  }
}
