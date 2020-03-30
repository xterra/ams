const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/groups\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      db.collection("groups").find().toArray(function(err, result){
        const test = result;
        console.log(`\n GROUPS \n ${test}`);
        console.log(test);
      });
      db.collection("groups").aggregate([
   {
     $lookup:
       {
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
]).sort({course: -1}).toArray(function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        const groups = result;
        console.log(groups);
        console.log(`\n ${JSON.stringify(groups[0].elderInfo)}`)
        return callback({
          title: "Группы",
          groups: groups,
          userInfo: userInfo
        }, "groups", 0, 0);
      });
    });
  }
}
