const router = require('../../../router');

module.exports = {
    path: new RegExp("^\/$"),
    processor: function (request, response, callback, sessionContext, sessionToken, db) {
        let dateNow = new Date();
        let dateMonthAgo = dateNow.setMonth(dateNow.getMonth() - 1);
        db.collection("news").find({dateUpdate: {$gte: new Date(dateMonthAgo)}}).sort({dateUpdate: -1}).limit(3).toArray(function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response)
          }
          let news = result;
          if(sessionToken == null || sessionContext == undefined || sessionContext == null){
            callback({
                title: "Главная страница",
                news: news,
                user: null
            }, "home", 5, 5);
          }else{
            callback({
                title: "Главная страница",
                news: news,
                user: sessionContext.login
            }, "home", 5, 5);
          }

        });

    }
};
