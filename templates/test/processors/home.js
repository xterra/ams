const router = require('../../../router'),
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp('^\/$'),
  processor: function (request, response, callback, sessionContext, sessionToken, db) {
    db.collection('news').find().sort({dateCreate: -1}).limit(3).toArray( (err, result) => {
      if(err){
        callback();
        return router.bleed(500, null, response)
      }
      let news = result;
      for (let pieceOfNews of news){
        pieceOfNews.formatedDate = beautyDate(pieceOfNews.dateCreate);
      }
      callback({
        title: 'Главная',
        news: news,
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'home', 0, 0);
    });
  }
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
