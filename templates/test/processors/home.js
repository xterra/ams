const beautyDate = require('../../../beautyDate'),
      isUserAuthed = require('./common/permission_check.js').isUserAuthed,
      dbMethods = require('./common/dbMethods.js'),
      bw = require('./common/bleed_wrapper.js');

module.exports = {
  path: new RegExp('^\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    dbMethods.getLastThreeNews(db, (err, result) => {
      if(err) return bw.redirectTo500Page(response, err, callback);

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
