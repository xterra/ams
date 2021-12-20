const router = require('../../../router'),
  qs = require('querystring'),
  bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  funcs = require('./groups/funcs.js'),
  dbMethods = require('./groups/dbMethods.js');

module.exports = {
  path: new RegExp('^/groups/edit/[^/]+/$'),
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

      const groupURL = funcs.getGroupUrlFromUrl(request.url);

      dbMethods.findGroupByUrl(groupURL, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        if (result == null) return bw.redirectTo404Page(response, request.url, callback);

        const groupInfo = result;

        dbMethods.getUserListForGroup(groupInfo, db, (err, result) => {

          if (err) return bw.redirectTo500Page(response, err, callback);
          const groupList = result;

          let errorMessage = '';
          if (request.method !== 'POST') {
            return renderPage(groupInfo, groupList, errorMessage, callback);
          }

          router.downloadClientPostData(request, (err, data) => {

            if (err) return redirectTo400Page(response, callback);

            try {
              const postData = qs.parse(data);

              if (/[А-яЁё]/gi.test(postData.url)) {
                errorMessage = 'Имя группы для ссылки должно быть на английском!';
                return renderPage(groupInfo, groupList, errorMessage, callback);
              }

              if (groupURL == postData.url) {
                return dbMethods.updateGroupInfoByUrl(groupURL, postData, db, err => {
                    if (err)
                        return bw.redirectTo500Page(response, err, callback);

                    console.log(`Group ${groupURL} info changed!`);
                    return bw.redirectToGroupsPage(response, callback);
                });
              }

              dbMethods.findGroupByUrl(postData.url, db, (err, foundGroup) => {

                if (err) return bw.redirectTo500Page(response, err, callback);
                if (foundGroup) {
                  errorMessage = 'Группа с таким URL уже существует!';
                  return renderPage(groupInfo, groupList, errorMessage, callback);
                }

                dbMethods.updateGroupInfoByUrl(groupURL, postData, db, err => {
                    if (err)
                        return bw.redirectTo500Page(response, err, callback);

                    console.log(`Group ${groupURL} info changed!`);
                    return bw.redirectToGroupsPage(response, callback);
                });
              });
            } catch (err) {
              console.log(`Processor error groups_edit: ${err}`);
              return redirectTo500Page(response, err, callback);
            }
          });
        });
      });
    });
  }
};

function renderPage(groupInfo, groupList, errorMessage, callback) {
  return callback({
    title: 'Изменение группы',
    groupInfo,
    groupList,
    errorMessage
  }, 'groups_form', 0, 0);
}
