const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp('^\/news\/delete\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if(err) return redirectTo500Page(response, err, callback);
      if(result == null) return redirectToLoginPage(response, callback);

      const userInfo = result;

      const userAdminOrTeacher = isUserAdminOrTeacher(userInfo);
      if(!userAdminOrTeacher) {
        const err = new Error('User role not admin or teacher');
        return redirectWithErrorCode(response, 403, err, callback);
      }

      const newsUrl = getNewsUrlFromRequest(request.url);
      findTitleAndAuthorForNews(newsUrl, db, (err, result) => {
        if(err) return redirectTo500Page(response, callback);
        if(result == null) return redirectTo404Page(response, request.url, callback);

        let newsDetail = result;
        const deletePermission = checkDeletePermissions(userInfo, newsDetail.author);
        if(!deletePermission) {
          const err = new Error('For this user permissions not enough');
          return redirectWithErrorCode(response, 403, err, callback);
        }

        if(request.method == 'POST') {
          deleteNews(newsDetail._id, db, err => {
            if(err) return redirectTo500Page(response, err, callback);
            callback();
            console.log(`News '${newsUrl}' deleted!`);
            return router.bleed(301, '/news/', response);
          });
        } else {
          return callback({
            title: 'Удаление новости',
            news_detail: newsDetail
          }, 'news_delete', 0, 0);
        }
      });
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
  return router.bleed(301, '/login/', response);
}

function getNewsUrlFromRequest(clientUrl){
  let decodedURL = decodeURI(clientUrl);
  let delimeteredURL = decodedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1},
    callback);
}

function redirectTo500Page(response, err, callback) {
  callback();
  return router.bleed(500, null, response, err);
}

function isUserAdminOrTeacher(userInfo) {
  const userRoles = userInfo.securityRole;
  if(userRoles.length !== 0) {
    return userRoles.includes('superadmin') ||
    userRoles.includes('admin') ||
    userRoles.includes('teacher');
  }
  return false;
}

function redirectWithErrorCode(response, code, err, callback) {
  callback();
  return router.bleed(code, null, response, err);
}

function findTitleAndAuthorForNews(newsUrl, db, callback) {
  db.collection('news').findOne(
    { url: newsUrl },
    { url: 1, title: 1, author: 1 },
    callback);
}

function redirectTo404Page(response, requestedURL, callback){
  callback();
  return router.bleed(404, requestedURL, response);
}

function checkDeletePermissions(userInfo, newsAuthorID) {
  const userRoles = userInfo.securityRole;
  const userID = userInfo._id.toString();

  return userRoles.includes('superadmin') ||
    userRoles.includes('admin') ||
    (userID == newsAuthorID);
}

function deleteNews(newsID, db, callback) {
  db.collection('news').deleteOne(
    { _id: new ObjectID(newsID) },
    callback);
}
