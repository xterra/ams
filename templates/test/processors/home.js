const router = require('../../../router'),
      beautyDate = require('../../../beautyDate');

module.exports = {
    path: new RegExp("^\/$"),
    processor: function (request, response, callback, sessionContext, sessionToken, db) {
        db.collection("news").find().sort({dateUpdate: -1}).limit(3).toArray(function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response)
          }
          let news = result;
          console.log(news);
          for (let pieceOfNews in news){
            console.log(JSON.stringify(news[pieceOfNews]));
            news[`${pieceOfNews}`].formatedDate = beautyDate(news[pieceOfNews].dateUpdate);
          }
          console.log(JSON.stringify(news));
          if(sessionToken == null || sessionContext == undefined || sessionContext == null){
            callback({
                title: "Главная",
                news: news,
                userAthorized: false
            }, "home", 5, 5);
          }else{
            callback({
                title: "Главная",
                news: news,
                userAthorized: true
            }, "home", 5, 5);
          }

        });

    }
}
