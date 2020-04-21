const router = require('../../../router');


module.exports = {
  path: new RegExp("^\/for-abiturients\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Абитуриентам",
        userAthorized: false
      }, "abiturients", 5, 5);
    } else{
      callback({
        title: "Абитуриентам",
        userAthorized: true
      }, "abiturients", 5, 5);
    }
  }
}
