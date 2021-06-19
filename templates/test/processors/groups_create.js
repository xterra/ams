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

      if (request.method !== 'POST') {
        return callback({
          title: 'Новая группа',
          errorMessage: ''
        }, 'groups_form', 0, 0);
      }

      router.downloadClientPostData(request, (err, data) => {

        if (err) return redirectTo400Page(response, callback);

        try {
          const postData = qs.parse(data);

          if (/[А-яЁё]/gi.test(postData.url)) {
            return callback({
              title: 'Новая группа',
              groupInfo: postData,
              errorMessage: 'Имя группы для ссылки должно быть на английском!'
            }, 'groups_form', 0, 0);
          }

          dbMethods.findGroupByUrl(postData.url, db, (err, foundGroup) => {

            if (err) return bw.redirectTo500Page(response, err, callback);
            if (foundGroup) {
              return callback({
                title: 'Новая группа',
                groupInfo: postData,
                errorMessage: 'Группа с таким URL уже существует!'
              }, 'groups_form', 0, 0);
            }

            dbMethods.createNewGroup(postData, db, err => {

              if (err) return bw.redirectTo500Page(response, err, callback);
              console.log(`Group ${postData.name} created!`);
              return bw.redirectToGroupsPage(response, callback);

            }); // createNewGroup
          }); //findGroupByUrl
        } catch (err) {
          console.log(`Processor error groups_create: ${err}`);
          return redirectTo500Page(response, err, callback);
        }
      }); //router.downloadClientPostData
    }); //getRoleForAuthedUser
  }
};
