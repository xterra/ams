const bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  funcs = require('./groups/funcs.js'),
  dbMethods = require('./groups/dbMethods.js');

module.exports = {
  path: new RegExp('^/groups/delete/[^/]+/$'),
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
        if (result == null)
            return bw.redirectTo404Page(response, request.url, callback);

        const groupInfo = result;

        if (request.method !== 'POST') {
          return callback({
            title: 'Удаление группы',
            groupInfo
          }, 'groups_delete', 0, 0);
        }

        dbMethods.deleteGroup(groupInfo, db, err => {

          if (err) return bw.redirectTo500Page(response, err, callback);
          console.log(`Group '${groupURL}' deleted!`);

          dbMethods.deleteGroupFromStudentsInfo(groupInfo, db, err => {

            if (err) console.log(`\n ERROR delete group from users info: ${err}`);
            console.log('Group from users is deleted!');
            return bw.redirectToGroupsPage(response, callback);
          });//deleteGroupFromStudentsInfo
        });//deleteGroup
      });//findGroupByUrl
    });//getRoleForAuthedUser
  }
};
