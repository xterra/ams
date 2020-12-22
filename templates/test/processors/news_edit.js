const router = require('../../../router'),
      ObjectID = require('mongodb').ObjectID,
      qs = require('querystring');

module.exports = {
  path: new RegExp('^\/news\/edit\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db){
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if(err) redirectTo500Page(response, err, callback);
      if(result == null) redirectToLoginPage(response, callback);

      const userInfo = result;

      const userAdminOrTeacher = isUserAdminOrTeacher(userInfo);
      if(!userAdminOrTeacher) {
        const err = new Error('User role not admin or teacher');
        return redirectWithErrorCode(response, 403, err, callback);
      }

      const urlForNews = getUrlForNewsFromClientRequest(request.url);
      findNewsByUrl(urlForNews, db, (err, result) => {
        if(err) return redirectTo500Page(response, err, callback);
        if(result == null) return redirectTo404Page(response, request.url, callback);

        const newsDetail = result;

        const editPermission = checkEditPermissions(userInfo, newsDetail.author);
        if(!editPermission) {
          const err = new Error('For this user permissions not enough');
          return redirectWithErrorCode(response, 403, err, callback);
        }

        if(request.method == 'POST') {
          return router.downloadClientPostData(request, (err, data) => {
            if(err) return redirectWithErrorCode(response, 400, err, callback);

            try{
              const postData = qs.parse(data);

              if(postData.short.length == 0) {
                return callback({
                  title: 'Редактирование новости',
                  errorMessage: 'Краткое описание не должно быть пустым!',
                  newsDetail: postData
                }, 'news_form', 0, 0);
              }
              updateCurrentNews(postData, newsDetail, db, (err) => {
                if(err) redirectTo500Page(response, err, callback);
                console.log('News edited!');
                callback();
                return router.bleed(301, `/news/${postData.url}/`, response);
              });

            } catch(err) {
              console.log(`Error in proccesor news_edit when POST: ${err}`);
              return redirectTo500Page(response, err, callback);
            }
          });
        }

        callback({
          title : "Редактирование новости",
          errorMessage : "",
          newsDetail : newsDetail
        }, 'news_form', 0, 0);
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

function getRoleForAuthedUser(userID, db, callback){
  db.collection('users').findOne({_id : new ObjectID(userID)}, {_id : 1, securityRole : 1},  callback);
}

function redirectTo500Page(response, err, callback){
  callback();
  return router.bleed(500, null, response, err);
}

function redirectTo404Page(response, requestedURL, callback){
  callback();
  return router.bleed(404, requestedURL, response);
}

function isUserAdminOrTeacher(userInfo){
  const userRoles = userInfo.securityRole;
  if(userRoles.length !== 0){
    return userRoles.includes('superadmin') || userRoles.includes('admin') || userRoles.includes('teacher');
  }
  return false;
}

function redirectWithErrorCode(response, code, err, callback){
  callback();
  return router.bleed(code, null, response, err);
}

function getUrlForNewsFromClientRequest(clientUrl){
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function findNewsByUrl(urlForNews, db, callback){
  return db.collection('news').findOne({url : urlForNews}, callback);
}

function checkEditPermissions(userInfo, newsAuthorID){
  const userRoles = userInfo.securityRole;
  const userID = userInfo._id.toString();

  return userRoles.includes('superadmin') || userRoles.includes('admin') || (userID == newsAuthorID);
}

function updateCurrentNews(newData, oldNewsDetail, db, callback){
  db.collection('news').updateOne({_id: new ObjectID(oldNewsDetail._id) }, {
    title: newData.title,
    short: newData.short,
    text: newData.text,
    url: newData.url,
    author: oldNewsDetail.author,
    dateCreate: oldNewsDetail.dateCreate,
    dateUpdate: new Date()
  }, callback);
}
