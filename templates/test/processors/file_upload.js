const router = require('../../../router'),
      qs = require('querystring'),
      bw = require('./common/bleed_wrapper.js'),
      dbMethods = require('./files/dbMethods.js'),
      funcs = require('./files/funcs.js'),
      check = require('./common/permission_check.js');

module.exports= {
  path: new RegExp('^\/file\/upload\/[^\/]+\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db){
    const userAuthed = check.isUserAuthed(sessionContext, sessionToken);
    if( !userAuthed ) return bw.redirectToLoginPage(response, callback);

    dbMethods.getRoleForAuthedUser(sessionContext.id, db, (err, result) => {
      if(err) return bw.redirectTo500Page(response, err, callback);
      const userInfo = result;

      const userAdminOrTeacher = check.isUserAdminOrTeacher(userInfo);
      if( !userAdminOrTeacher ) {
        const err = new Error('User role not admin or teacher');
        return bw.redirectWithErrorCode(response, 403, err, callback);
      }

      const disciplineAllias = funcs.getDiscAlliasForCreate(request.url);
      dbMethods.findDisciplineByAllias(disciplineAllias, db, (err, result) => {
        if(err) return bw.redirectTo500Page(response, err, callback);

        const discipline = result;

        const teacherEditor = check.isTeacherDisciplineEditor(userInfo, discipline);
        if( !teacherEditor ) {
            const err = new Error('Teacher is not discipline edirot');
            return bw.redirectWithErrorCode(response, 403, err, callback);
        }

        if(request.method == 'POST') {

          return router.downloadClientPostData(request, (err, body) => {
            if(err) return bw.redirectTo500Page(response, err, callback);
            try {
              let postData = qs.parse(body);
              const fileID = postData.fileID;

              funcs.moveFileFromTmpStorage(fileID, (err) => {
                if(err) {
                  console.log(`Something wrong with move ${fileID}: ${err}`);
                  return bw.redirectTo500Page(response, err, callback);
                }
                console.log(`File ${fileID} moved to - /data/private/`);

                dbMethods.addFileInfoToDB(postData, userInfo, db, (err) => {
                  if(err) return bw.redirectTo500Page(response, err, callback);
                  console.log(`Info for file ${fileID} added to DB`);
                });
                return dbMethods.addFileIdToDiscipline(disciplineAllias, fileID, db, (err) => {
                  if(err) return bw.redirectTo500Page(response, err, callback);
                  console.log(`File ${fileID} added to discipline ${disciplineAllias}`);

                  return callback({
                    title: 'Загрузка файла',
                    discipline: discipline,
                    userInfo: userInfo,
                    message: `Файл загружен. Добавлен к '${discipline.name}'`,
                  }, 'file_upload', 0, 0);
                });
              });
            } catch (err) {
              console.log(err);
              bw.redirectTo500Page(response, err, callback);
            }
          });
        } else {
          return callback({
            title: 'Загрузка файла',
            discipline: discipline,
            userInfo: userInfo,
            message: ''
          }, 'file_upload', 0, 0);
        }
      });
    });
  }
}
