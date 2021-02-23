const qs = require('querystring'),
      router = require('../../../router'),
      security = require('../../../security'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp(/^\/profiles\/[^\/]{24,}\/$/u),
  processor: function (request, response, callback, sessionContext, sessionToken, db) {
    if(sessionToken == null || sessionContext == undefined || sessionContext == null) {
      callback();
      return router.bleed(301, '/login/', response);
    }
    let urlPath = decodeURI(request.url);
    const ids = urlPath.match(/[^\/]{24}/g);
    console.log(ids);
    if (sessionContext !== null && ids.length > 0) {
      db.collection('users').aggregate([
         {$match: {_id: new ObjectID(ids[0])}},
         {
           $lookup:
             {
               from: 'groups',
               let: { group: '$group'},
               pipeline: [
                 { $match:
                   {$expr:
                     { $eq: ['$_id', '$$group']}
                   }
                 },
                 { $project: {fullname : 1, name : 1, course : 1}},
               ],
               as: 'groupInfo'
             }
        }], function(err, result) {
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          if(result == null){
            callback();
            return router.bleed(404, request.url, response);
          }
          let profileInfo = result[0];
          if(sessionContext !== undefined && ids[0].toString() == sessionContext.id) {
            return callback({
              title: 'Личный профиль',
              profileInfo: profileInfo,
            }, 'profile', 0, 0);
          } else {
            db.collection('users').findOne(
              { _id : sessionContext.id },
              { username : 1, securityRole : 1 },
              function(err, result) {
                if(err) {
                  callback();
                  return router.bleed(500, null, response, err);
                }
                if(result == null) {
                  callback();
                  return router.bleed(403, request.url, response);
                }
                let userInfo = result;
                return callback({
                    title: 'Чужой профиль',
                    profileInfo: profileInfo,
                    userInfo: userInfo
                }, 'strangerProfile', 0, 0);
              });
          }
      });
    } else {
        callback();
        return router.bleed(404, request.url, response);
    }
  }
};
