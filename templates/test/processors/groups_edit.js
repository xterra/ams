const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/groups\/edit\/[^\/]+$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    let requestedUrl = decodeURI(request.url);
    let delimeteredUrl = requestedUrl.split('/');
    let groupURL = delimeteredUrl[delimeteredUrl.length-2];

    db.collection("groups").aggregate([
      { $match: {url : groupURL} },
      { $lookup: {
        from: "users",
        let: { elder: "$elder"},
        pipeline: [
          { $match:
            {$expr:
              { $eq: ["$_id", "$$elder"]}
            }
          },
          { $project: {lastName: 1, name: 1}},
        ],
        as: "elderInfo"
      }
    }
  ], function(err, result){
    if(err){
      callback();
      return router.bleed(500, null, response, err);
    }
    console.log(result);
    const groupInfo = result;
    db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 && !userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("admin")){
        callback();
        return router.bleed(403, null, response);
      }
    });
  });
  }
}
