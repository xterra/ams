const bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  dbMethods = require('./files/dbMethods.js'),
  funcs = require('./files/funcs.js'),
  path = require('path');

module.exports = {
  path: new RegExp('^/file/delete/[^/]+/[^/]+/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if (!userAuthed) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if (err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const userAdminOrTeacher = check.isUserAdminOrTeacher(userInfo);
      if (!userAdminOrTeacher) {
        const err = new Error('User role not admin or teacher');
        return bw.redirectWithErrorCode(response, 403, err, callback);
      }

      const disciplineAllias = funcs.getDiscAlliasFromUrl(request.url);

      dbMethods.findDisciplineByAllias(disciplineAllias, db, (err, result) => {
        if (err) return bw.redirectTo500Page(response, err, callback);
        if (result === null)
            return bw.redirectTo404Page(response, request.url, callback);
        const discipline = result;

        const teacherEditor = check.isTeacherDiscEditor(userInfo, discipline);
        if (!teacherEditor) {
          const err = new Error('Teacher is not discipline editor');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        const fileID = funcs.getFileIDFromUrl(request.url);

        dbMethods.getFileInfoById(fileID, db, (err, result) => {
          if (err) return bw.redirectTo500Page(response, err, callback);
          if (result === null)
              return bw.redirectTo404Page(response, request.url, callback);
          const fileInfo = result;

          if (request.method !== 'POST') {
            return callback({
              title: 'Удаление файла',
              disciplineAllias,
              file: fileInfo,
              errorMessage: ''
            }, 'file_delete', 0, 0);
          }

          funcs.deleteFileFromServer(fileID, err => {
            if (err) return bw.redirectTo500Page(response, err, callback);
            console.log(`File ${fileID} deleted from server.
                          \n Start check file Dir`);

            const dirName = fileID.substr(0,2);

            funcs.deleteDirIfEmpty(dirName, err => {
              if (err) console.log(`Error with deleting ${dirName}`);
              console.log(`Dir ${dirName} deleted`);
            });

            dbMethods.deleteFileFromDB(fileID, db, err => {
              if (err) return bw.redirectTo500Page(response, err, callback);

              dbMethods.deleteFileFromDiscipline(disciplineAllias, fileID, db, err => {
                if (err) return bw.redirectTo500Page(response, err, callback);
                return bw.redirectToDiscByAllias(response, disciplineAllias, callback);
              }); //deleteFileFromDiscipline
            }); //deleteFileFromDB
          }); //deleteFileFromServer
        }); //getFileInfoById
      }); //findDisciplineByAllias
    }); //getRoleForAuthedUser
  }
};
