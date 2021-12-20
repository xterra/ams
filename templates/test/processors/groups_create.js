const qs = require('querystring'),
  router = require('../../../router'),
  bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  funcs = require('./groups/funcs.js'),
  dbMethods = require('./groups/dbMethods.js');

module.exports = {
  path: new RegExp('^/groups/new/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const userAdmin = check.isUserAdmin(userInfo);
      if (!userAdmin) {
        const err = new Error('User role not admin');
        return bw.redirectWithErrorCode(response, 403, err, callback);
      }
      let errorMessage = '';

      if (request.method !== 'POST') {
        return renderPage(undefined, errorMessage, callback);
      }

      router.downloadClientPostData(request, (err, data) => {

        if (err) return redirectTo400Page(response, callback);

        try {
          const postData = qs.parse(data);
          if (/[А-яЁё]/gi.test(postData.url)) {
            errorMessage = 'Имя группы для ссылки должно быть на английском!';
            return renderPage(postData, errorMessage, callback);
          }

          //check on existence group by URL
          dbMethods.findGroupByUrl(postData.url, db, (err, foundGroup) => {

            if (err) return bw.redirectTo500Page(response, err, callback);
            if (foundGroup) {
              errorMessage = 'Группа с таким URL уже существует!';
              return renderPage(postData, errorMessage, callback);
            }

            dbMethods.createNewGroup(postData, db, err => {

              if (err) return bw.redirectTo500Page(response, err, callback);
              console.log(`Group ${postData.name} created!`);
              return bw.redirectToGroupsPage(response, callback);

            });
          });
        } catch (err) {
          console.log(`Processor error groups_create: ${err}`);
          return redirectTo500Page(response, err, callback);
        }
      });
    });
  }
};

function renderPage(groupInfo, errorMessage, callback) {
  return callback({
    title: 'Новая группа',
    groupInfo,
    errorMessage
  }, 'groups_form', 0, 0);
}
