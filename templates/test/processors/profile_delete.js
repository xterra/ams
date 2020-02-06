const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/profiles\/delete\/[^\/]{24,}\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection('users').findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const requestedUrl = decodeURI(request.url);
      if(result == null){
        callback();
        return router.bleed(400, requestedUrl, response, err);
      }
      let adminInfo = result;
      if( adminInfo.securityRole.length == 0 || !adminInfo.securityRole.includes("superadmin")){
        callback();
        return router.bleed(403, requestedUrl, response);
      }
      let userId = requestedUrl.match(/[^\/]{24}/g)[0];
      console.log(userId);
      db.collection('users').findOne({_id: new ObjectID(userId)}, {username: 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          if(result == null){
            callback();
            return router.bleed(400, null, response);
          }
          let userInfo = result;
          if(request.method == "POST"){
            return db.collection("users").deleteOne({_id: new ObjectID(userInfo._id)}, function(err, result){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log(result.result);
              callback();
              console.log(`Profile ${userInfo.username} deleted!`);
              return router.bleed(301, "/profiles/", response);
            });
          }else{
            return callback({
              title: "Delete profile",
              adminInfo: adminInfo,
              userInfo: userInfo
            }, "profile_delete", 0, 0);
          }
      });
    });
  }
}
