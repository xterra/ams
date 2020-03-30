const router = require("../../../router"),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/groups\/delete\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split("/");
    groupURL = delimeteredUrl[delimeteredUrl.length-2];
    db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        return router.bleed(301, "/login/", response);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 || ((!userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("admin")))){
        callback();
        return router.bleed(403, null, response);
      }
      db.collection("groups").findOne({url: groupURL}, {fullname: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(301, "/groups/", response);
        }
        const groupInfo = result;
        if(request.method == "POST"){
          db.collection("groups").deleteOne({_id: new ObjectID(groupInfo._id)}, function(err){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            console.log(`Group "${groupURL}" deleted!`);
            db.collection("users").update({group: new ObjectID(groupInfo._id)}, {
              $unset: { group: '' } 
            }, function(err){
              if(err){
                console.log(`\n ERROR delete group from users \n error message: ${err}`);
              }
                console.log(`Group from users is deleted!`);
                callback();
                return router.bleed(301, "/groups/", response);
            });
          });
        }else{
          return callback({
            title: "Удаление группы",
            groupInfo: groupInfo
          }, "groups_delete", 0, 0);
        }
      });
    });
  }
}
