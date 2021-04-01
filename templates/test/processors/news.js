const beautyDate = require('../../../beautyDate'),
      isUserAuthed = require('./common/permission_check.js').isUserAuthed,
      dbMethods = require('./common/dbMethods.js'),
      bw = require('./common/bleed_wrapper.js');

module.exports = {
  path: new RegExp('^\/news\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    dbMethods.findAllNewsWithAuthor(db, (err, result) => {
      if(err) return bw.redirectTo500Page(response, err, callback);

      const news = result.map(pieceOfNews => {
        pieceOfNews.formatedDate = beautyDate(pieceOfNews.dateCreate);
        return pieceOfNews;
      });

      const userAuthed = isUserAuthed(sessionContext, sessionToken);
      if(userAuthed) {
        dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
          if(err) return bw.redirectTo500Page(response, err, callback);

          const userInfo = result;
          return callback({
            title: 'Новости',
            news: news,
            userInfo: userInfo
          }, 'news', 0, 5);
        });
      } else {
        callback({
          title: 'Новости',
          news: news,
          userInfo: null
        }, 'news', 0, 5);
      }
    });
  }
}
