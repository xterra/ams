const router = require('../../../router'),
      beautyDate = require('../../../beautyDate');

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
                user: null
            }, "home", 5, 5);
          }else{
            callback({
                title: "Главная",
                news: news,
                user: sessionContext.login
            }, "home", 5, 5);
          }

        });

    }
}

function formateDate(date){
  const months = {
    0: "Января",
    1: "Февраля",
    2: "Марта",
    3: "Апреля",
    4: "Мая",
    5: "Июня",
    6: "Июля",
    7: "Августа",
    8: "Сентября",
    9: "Октября",
    10: "Ноября",
    11: "Декабря"
  };
  console.log(date);
  let passedDate = new Date(date);
  let todaysDate = new Date();

  let passedDateStr = `${passedDate.getDate()} ${months[passedDate.getMonth()]} ${passedDate.getFullYear()}`;
  let todaysDateStr = `${todaysDate.getDate()} ${months[todaysDate.getMonth()]} ${todaysDate.getFullYear()}`;
  if(passedDateStr == todaysDateStr) return "Сегодня"
  return passedDateStr;
}
