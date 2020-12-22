const qs = require('querystring'),
      ObjectID = require('mongodb').ObjectID,
      router = require('../../../router');

module.exports = {
  path: new RegExp('^\/news\/create\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if(err) return redirectTo500Page(response, err, callback);
      if(result == null) redirectToLoginPage(response, callback);
      const userInfo = result;

      const userAdminOrTeacher = isUserAdminOrTeacher(userInfo);
      if(!userAdminOrTeacher) {
        const err = new Error('User role not admin or teacher');
        return redirectWithErrorCode(response, 403, err, callback);
      }

      if(request.method == 'POST') {
        return router.downloadClientPostData(request, (err, body) => {
          if(err) return redirectWithErrorCode(response, 400, err, callback);

          try {
            const postData = qs.parse(body);

            if(postData.short.length == 0) {
              return callback({
                title: 'Создание новости',
                newsDetail: postData,
                errorMessage: 'Краткое описание не должно быть пустым!'
              }, 'news_form', 0, 0);
            }

            createNews(postData, userInfo, db, (err) => {
              if(err) return redirectTo500Page(response, err, callback);
              console.log('News created!');
              callback();
              return router.bleed(301, '/news/', response);
            });

          } catch(err) {
            console.log(`Processor error create_news: ${err}`);
            redirectTo500Page(response, err, callback);
          }
        }, 10000000);
      } else {
        callback({
          title: 'Создание новости',
          errorMessage: ''
        }, 'news_form', 0, 0);
      }
    });
  }
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function redirectToLoginPage(response, callback) {
  callback();
  return router.bleed(301, null, response);
}

function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback);
}

function redirectTo500Page(response, err, callback) {
  callback();
  return router.bleed(500, null, response, err);
}

function isUserAdminOrTeacher(userInfo) {
  const userRoles = userInfo.securityRole;
  if(userRoles.length !== 0){
    return ( userRoles.includes('superadmin') ||
      userRoles.includes('admin') ||
      userRoles.includes('teacher') );
  }
  return false;
}

function redirectWithErrorCode(response, code, err, callback) {
  callback();
  return router.bleed(code, null, response, err);
}

function createNews(news, userInfo, db, callback) {
  db.collection('news').insertOne( {
          title: news.title,
          short: news.short,
          text: news.text,
          url: news.url,
          author: userInfo._id.toString(),
          dateCreate: new Date(),
          dateUpdate: new Date(),
          hidden: news.hidden
        }, callback);
}
