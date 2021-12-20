const bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  funcs = require('./groups/funcs.js'),
  dbMethods = require('./groups/dbMethods.js');

module.exports = {
  path: new RegExp('^/groups/[^/]+/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {

      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const groupURL = funcs.getGroupUrlFromUrl(request.url);
      dbMethods.findGroupByUrl(groupURL, db, (err, result) => {

        if (err) return bw.redirectTo500Page(response, err, callback);
        if (result == null)
          return bw.redirectTo404Page(response, request.url, callback);

        const groupInfo = result;

        dbMethods.getUserListForGroup(groupInfo, db, (err, result) => {
          if (err) return bw.redirectTo500Page(response, err, callback);
          const groupList = result;
          return callback({
            title: 'Инфо о группе',
            groupInfo,
            groupList,
            userInfo
          }, 'groups_detail', 0, 0);
        });
      });
    });
  }
}
