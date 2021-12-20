const bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  dbMethods = require('./groups/dbMethods.js');

module.exports = {
  path: new RegExp('^/groups/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {

      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      dbMethods.getGroupListWithElderInfo(db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        const groups = result;

        return callback({
          title: 'Группы',
          groups,
          userInfo
        }, 'groups', 0, 0);

      });
    });
  }
};
