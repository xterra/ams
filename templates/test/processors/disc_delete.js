const qs = require('querystring'),
      router = require('../../../router'),
      path = require('path'),
      fs = require('fs');

module.exports = {
  path: new RegExp('^\/disciplines\/delete\/[^\/]+\/$'),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, '/login/', response);
    }
    requestedUrl = decodeURI(request.url);
    delimeteredUrl = requestedUrl.split('/');
    disciplineAllias = delimeteredUrl[delimeteredUrl.length-2];
    db.collection('users').findOne({_id: sessionContext.id},{username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return  router.bleed(500, null, response);
      }
      if(result == null){
        callback();
        return router.bleed(301, '/login/', response);
      }
      const userInfo = result;
      if(userInfo.securityRole.length == 0 || ((!userInfo.securityRole.includes('superadmin') && !userInfo.securityRole.includes('teacher')))){
        callback();
        return router.bleed(403, null, response);
      }
      db.collection('disciplines').findOne({allias: disciplineAllias}, {name: 1, editors: 1, files: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response);
        }
        if(result == null){
          callback();
          return router.bleed(301, '/disciplines/', response);
        }
        const discipline = result;
        if(!(userInfo.securityRole.includes('superadmin')) && !(discipline.editors.includes(userInfo._id.toString()))){
          callback();
          return router.bleed(301, '/disciplines/', response);
        }
        if(request.method == 'POST') {
          deleteAtachedFiles(discipline, db, (err) => {
            if(err) {
              console.log(`Error with delete files in disc_delete: ${err}`);
            } else{
              console.log(`Delete files successful for ${disciplineAllias}`);
            }
          });
          db.collection('disciplines').deleteOne({allias: disciplineAllias}, function(err, result){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                callback();
                console.log(`Discipline '${disciplineAllias}' deleted!`);
                return router.bleed(301, '/disciplines/', response);
              });
        } else {
          return callback({
            title: 'Удаление дисциплины',
            discipline: discipline
          }, 'disc_delete', 0, 0);
        }
      });
    });
  }
}
function deleteAtachedFiles(discipline, db, callback){
  let fileNames = discipline.files;
  if(fileNames.length == 0) return callback(null);
  const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
  const PATH_TO_FILES = STORAGE_DATA_LOCATION || path.join(__dirname, '../../../', '/data/private');
  let dirName = '',
      dirFiles = [];
  try{
    for (let file of fileNames){
      dirName = file.substr(0, 2);
      fs.unlinkSync(`${PATH_TO_FILES}/${dirName}/${file}`);
      let deletionResult = db.collection('files').remove({_id: file});
      dirFiles = fs.readdirSync(`${PATH_TO_FILES}/${dirName}/`);
      if(dirFiles.length == 0){
        fs.rmdir(`${PATH_TO_FILES}/${dirName}/`, (err) =>{
          if(err) console.log(`Error with delete folder ${PATH_TO_FILES}/${dirName}/: ${err}`)
          console.log(`Folder ${PATH_TO_FILES}/${dirName}/ was deleted`);
        });
      }
    }
    callback(null);
  }catch(err){
    callback(err);
  }
}
