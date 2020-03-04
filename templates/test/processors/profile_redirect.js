const router = require('../../../router')
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp("^\/profile\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({_id: new ObjectID(sessionContext.id)}, {_id: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        return router.bleed(404, null, response);
      }
      callback();
      return router.bleed(301, `/profiles/${result._id}/`, response);
    });
  }
}
