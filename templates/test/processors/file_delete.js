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
      return dbMethods.findDisciplineByAllias(disciplineAllias, db, (err, result) => {
        if (err) return bw.redirectTo500Page(response, err, callback);
        if (result === null) return bw.redirectTo404Page(response, request.url, callback);
        const discipline = result;

        const teacherEditor = check.isTeacherDisciplineEditor(userInfo, discipline);
        if (!teacherEditor) {
          const err = new Error('Teacher is not discipline edirot');
          return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        const fileID = funcs.getFileIDFromUrl(request.url);
        return dbMethods.getFileInfoById(fileID, db, (err, result) => {
          if (err) return bw.redirectTo500Page(response, err, callback);
          if (result === null) return bw.redirectTo404Page(response, request.url, callback);
          const fileInfo = result;

          if (request.method === 'POST') {
            const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
            const PATH_TO_FILES_DIR = STORAGE_DATA_LOCATION || path.join(__dirname, '../../../', '/data/private');
            const dirName = fileID.substr(0, 2);
            const pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}/${fileID}`;
            funcs.deleteFileFromServer(pathToCurrentFile, err => {
              if (err) return bw.redirectTo500Page(response, err, callback);
              console.log(`File ${pathToCurrentFile} deleted from server.
                            \n Start check file Dir`);

              const pathToCurrentDir = `${PATH_TO_FILES_DIR}/${dirName}`;
              funcs.checkExistPath(pathToCurrentDir, checkedPath => {
                if (checkedPath) {
                  funcs.deleteDirFromServer(checkedPath, err => {
                    if (err) console.log(`Something wrong with deleting ${checkedPath}`);
                    console.log(`Dir ${checkedPath} deleted`);
                  });
                }
                dbMethods.deleteFileFromDB(fileID, db, err => {
                  if (err) return bw.redirectTo500Page(response, err, callback);

                  dbMethods.deleteFileFromDiscipline(disciplineAllias, fileID, db, err => {
                    if (err) return bw.redirectTo500Page(response, err, callback);
                    return bw.redirectToDiscByAllias(response, disciplineAllias, callback);
                  });
                });
              });
            });
          } else {
            return callback({
              title: 'Удаление файла',
              disciplineAllias,
              file: fileInfo,
              errorMessage: ''
            }, 'file_delete', 0, 0);
          }
        });
      });
    });
  }
};
