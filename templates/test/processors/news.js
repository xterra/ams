const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID,
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp('^\/news\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    findAllNewsWithAuthor(db, (err, result) => {
      if(err) return redirectTo500Page(response, err, callback);

      const news = result.map(pieceOfNews => {
        pieceOfNews.formatedDate = beautyDate(pieceOfNews.dateCreate);
        return pieceOfNews;
      });

      const userAuthed = isUserAuthed(sessionContext, sessionToken);
      if(userAuthed) {
        getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
          if(err) return redirectTo500Page(response, err, callback);
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

function findAllNewsWithAuthor(db, callback) {
  db.collection('news').aggregate([
     {
       $lookup:
         {
           from: 'users',
           let: { author: '$author' },
           pipeline: [
             { $match:
                {$expr:
                 { $eq: [{ $toString: '$_id' }, '$$author']  }
                }
             },
             { $project:
               { _id: 0, lastName: 1, name: 1, fatherName: 1, securityRole: 1 }
             },
           ],
           as: 'authorInfo'
         }
      },
  ]).sort({ dateCreate: -1 }).toArray(callback);
}

function redirectTo500Page(response, err, callback){
  callback();
  return router.bleed(500, null, response, err);
}

function isUserAuthed(sessionContext, sessionToken) {
  return( typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined)
}

function getRoleForAuthedUser(userID, db, callback){
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback);
}
