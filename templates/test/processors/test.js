const router = require('../../../router'),
      qs = require('querystring');


module.exports = {
  path: new RegExp("^\/test\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(request.method == "POST"){
      router.downloadClientPostData(request, function(err, body){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        const postData = qs.parse(body);
        console.log(postData.multiple_select);
      });
    }else {
      return callback({
        title: "Test",
      }, "test", 5, 5);
    }
  }
}
