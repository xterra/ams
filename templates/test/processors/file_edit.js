const router = require('../../../router'),
  qs = require('querystring'),
  bw = require('./common/bleed_wrapper.js'),
  check = require('./common/permission_check.js'),
  dbMethods = require('./files/dbMethods.js'),
  funcs = require('./files/funcs.js');

module.exports = {
  path: new RegExp('^/file/edit/[^/]+/[^/]+/$'),
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
            return router.downloadClientPostData(request, (err, data) => {
              if (err) return bw.redirectTo500Page(response, err, callback);
              try {
                const editedFileInfo = qs.parse(data);
                const tmpFileID = editedFileInfo.fileID;
                if (tmpFileID == null || tmpFileID == '') {
                  console.log(`Update without overwriting the file.... ${fileID}`);
                  return dbMethods.updateFileNameAndComment(fileID, editedFileInfo, userInfo, db, err => {
                    if (err) return bw.redirectTo500Page(response, err, callback);

                    console.log(`File info ${fileID} updated!`);
                    return bw.redirectToDiscByAllias(response, disciplineAllias, callback);
                  });
                } else {
                  console.log(`Update WITH overwriting the file.... ${fileID}`);
                  return funcs.replaceFileFromTmpStorage(tmpFileID, fileID, err => {
                    if (err) {
                      console.log(`Something wrong with replace ${tmpFileID}: ${err}`);
                      return callback({
                        title: 'Редактирование файла',
                        fileInfo,
                        discipline,
                        userInfo,
                        errorMessage: 'Проблемы с обновлением файла. Попробуйте загрузить файл повторно.'
                      }, 'file_edit', 0, 0);
                    }
                    console.log(`File ${tmpFileID} replaced for - ${fileID}`);
                    dbMethods.updateFileInfoById(fileID, editedFileInfo, userInfo, db, err => {
                      if (err) return bw.redirectTo500Page(response, err, callback);
                      console.log(`Info for file ${fileID} updated in DB`);
                      return bw.redirectToDiscByAllias(response, disciplineAllias, callback);
                    });
                  });
                }
              } catch (err) {
                return bw.redirectTo500Page(response, err, callback);
              }
            });
          } else {
            return callback({
              title: 'Редактирование файла',
              fileInfo,
              discipline,
              userInfo,
              errorMessage: ''
            }, 'file_edit', 0, 0);
          }
        });
      });
    });
  }
};
