const bleed = require('../../../router').bleed,
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp("^\/news\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db) {
    db.collection("news").aggregate([
       {
         $lookup:
           {
             from: "users",
             let: { author: "$author"},
             pipeline: [
               { $match:
                  {$expr:
                   { $eq: [{$toString: "$_id"}, "$$author"]  }
                  }
               },
               { $project: {_id: 0, lastName: 1, name: 1, fatherName: 1, securityRole: 1}},
             ],
             as: "authorInfo"
           }
        },
    ]).sort({dateCreate: -1}).toArray(function(err, result){
      if(err) {
        callback();
        return bleed(500, null, response, err);
      }
      const news = result;
      for (let pieceOfNews of news){
        pieceOfNews.formatedDate = beautyDate(pieceOfNews.dateCreate);
      }
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback({
        title: "Новости",
        news: news,
        userInfo: null
      }, "news", 0, 5);
    } else{
        db.collection("users").findOne({_id: sessionContext.id}, {username: 1, securityRole: 1}, function(err, result){
          if(err){
            callback();
            return bleed(500, null, response, err);
          }
          let user = result;
          return callback({
            title: "Новости",
            news: news,
            userInfo: user
          }, "news", 0, 5);
        });
      }
    });
  }
}
