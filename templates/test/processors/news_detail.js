const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID,
      beautyDate = require('../../../beautyDate');

module.exports = {
  path: new RegExp('^\/news\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const newsUrl = getUrlForNewsFromClientRequest(request.url);

    findNewsWithAuthorByUrl(newsUrl, db, (err, result) => {
      if(err) return redirectTo500Page(response, err, callback);

      if(result == null) return redirectTo404Page(response, request.url, callback);

      let newsDetail = result[0];
      newsDetail.formatedDate = beautyDate(newsDetail.dateCreate);

      const userAuthed = isUserAuthed(sessionContext, sessionToken);
      if(userAuthed) {
        getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
          if(err) return redirectTo500Page(response, err, callback);
          if(result == null) return redirectTo404Page(response, request.url, callback);

          const userInfo = result;
          return callback({
            title: 'Новость',
            newsDetail: newsDetail,
            userInfo: userInfo
          }, 'news_detail', 0, 0);
        });
      } else {
        callback({
          title: 'Новость',
          newsDetail: newsDetail,
          userInfo: null
        }, 'news_detail', 0, 0);
      }
    });
  }
}

function getUrlForNewsFromClientRequest(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function findNewsWithAuthorByUrl(newsUrl, db, callback){
  db.collection('news').aggregate([
     {
       $match: {url : newsUrl}
     },
     {
       $lookup:
         {
           from: 'users',
           let: { author: '$author' },
           pipeline: [
             { $match:
                {$expr:
                 { $eq: [ {$toString: '$_id'}, '$$author' ] }
                }
             },
             { $project:
               {_id: 0, lastName: 1, name: 1, fatherName: 1, securityRole: 1}
             },
           ],
           as: 'authorInfo'
         }
      },
  ]).toArray(callback);
}

function redirectTo500Page(response, err, callback){
  callback();
  return router.bleed(500, null, response, err);
}

function redirectTo404Page(response, requestedURL, callback){
  callback();
  return router.bleed(404, requestedURL, response);
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function getRoleForAuthedUser(userID, db, callback){
  db.collection('users').findOne(
    { _id : new ObjectID(userID) },
    { _id : 1, securityRole : 1 },
  callback);
}
