const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/profiles\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").find({}).toArray(function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      let users = result;
      let currentUser = users.find((element, index, array)=>{
        if(element.username == sessionContext.login){
          return element;
        } else{
          return false;
        }
      });
      return callback({
        title: "Список пользователей",
        profiles: users,
        currentUser: currentUser
      }, "profile_list", 0, 0);
    });
  }
}
