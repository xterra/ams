const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/groups\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    let requestedUrl = decodeURI(request.url);
    let delimeteredUrl = requestedUrl.split("/");
    let groupURL = delimeteredUrl[delimeteredUrl.length-2];
    db.collection("users").findOne({_id: new ObjectID(sessionContext.id)}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      db.collection("groups").findOne({url: groupURL}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          return router.bleed(404, requestedUrl, response);
        }
        const groupInfo = result;
        db.collection("users").find({group: groupInfo._id}, {lastName: 1, name: 1}).toArray(function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, bleed);
          }
          console.log(result);
          console.log(groupInfo.elder)
          const groupList = result;
          return callback({
            title: "Инфо о группе",
            groupInfo: groupInfo,
            groupList: groupList,
            userInfo: userInfo
          }, "groups_detail", 0, 0);
        });
      });
    });
  }
}
