const router = require('../../../router');

module.exports = {
  path: new RegExp("^\/news\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    const requsetedURL = decodeURI(request.url);
    const delimeteredURL = requsetedURL.split("/");
    const newsUrl = delimeteredURL[delimeteredURL.length - 2];

    db.collection("news").findOne({url: newsUrl}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      if(result == null){
        callback();
        return router.bleed(404, requsetedURL, response);
      }
      const news_detail = result,
            newsDateString = getDateString(news_detail.dateUpdate);
      if(sessionToken == null || sessionContext == undefined || sessionContext == null){
        callback({
          title: "Новость",
          news_detail: news_detail,
          newsDateString: newsDateString,
          user: null
        }, "news_detail", 5, 5);
      } else{
        callback({
          title: "Новость",
          news_detail: news_detail,
          newsDateString: newsDateString,
          user: sessionContext.login
        }, "news_detail", 5, 5);
      }
    });

  }
}
function getDateString(date){
  const months = {
    0: "Январь",
    1: "Февраль",
    2: "Март",
    3: "Апрель",
    4: "Май",
    5: "Июнь",
    6: "Июль",
    7: "Август",
    8: "Сентябрь",
    9: "Октябрь",
    10: "Ноябрь",
    11: "Декабрь"
  };

  return `${months[date.getMonth()]} ${date.getDay()}, ${date.getFullYear()}`;
}
