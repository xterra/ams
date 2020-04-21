const fs = require("fs"),
      router = require('../../../router'),
      path = require("path"),
      ini = require('ini');
module.exports = {
  path: new RegExp("^\/file\/delete\/[^\/]+\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({_id: sessionContext.id},{username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      let userInfo = result;
      console.log(userInfo.securityRole);
      if(userInfo.securityRole.length == 0 || (!userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("teacher"))){
        callback();
        return router.bleed(403, null, response);
      }
      let requestedUrl = decodeURI(request.url);
      let delimeteredUrl = requestedUrl.split("/");
      let requestFileName = delimeteredUrl[delimeteredUrl.length - 2];
      let disciplineAllias = delimeteredUrl[delimeteredUrl.length - 3];
      console.log(requestFileName);
      return db.collection("files").findOne({_id: requestFileName}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          if(result == null){
            callback();
            console.log(`File not found: ${requestFileName}`);
            return router.bleed(400, null, response);
          }
          let fileInfo = result;
          if(request.method == "POST"){
            const storageConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, "../../../" , "configurations", "storage.ini"), "utf-8"));
            console.log(storageConfigurations['data']['location']);
            const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
            console.log(`STORAGE_DATA_LOCATION: ${STORAGE_DATA_LOCATION}`);
            const PATH_TO_FILES = STORAGE_DATA_LOCATION || storageConfigurations['data']['location'] || path.join(__dirname, "../../../", "/data/private");
            const dirName = requestFileName.substr(0,2);
            fs.unlink(`${PATH_TO_FILES}/${dirName}/${requestFileName}`, function(err){
              if(err){
                console.log(`Error with deleting file ${requestFileName} from server: ${err}`);
              }
              console.log(`File ${requestFileName} deleted from server. \n Start check file Dir`);
              fs.readdir(`${PATH_TO_FILES}/${dirName}/`, function(err, files){
                if(err){
                  console.log(`Error with read dir: ${err}`);
                }
                if(files.length == 0){
                  fs.rmdir(`${PATH_TO_FILES}/${dirName}/`, function(err){
                    if(err){
                      console.log(`Error with deleting dir ${dirName}: ${err}`);
                    }
                    console.log(`Dir ${dirName} deleted from server!`);
                  });
                }
              });
            });
            try{
              db.collection("files").deleteOne({_id: requestFileName});
            }catch(err){
              console.log(`Deleting file error: ${err}`);
              return callback({
                title: "Удаление файла",
                disciplineAllias: disciplineAllias,
                file: fileInfo,
                errorMessage: "Что-то не так с удалением файла"
              }, "file_delete", 0, 0);
            }
          return db.collection("disciplines").update({files: requestFileName}, {$pull: { files: requestFileName}}, function(err){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              callback();
              return router.bleed(301, `/disciplines/${disciplineAllias}/`, response);
            });
          } else{
            return callback({
              title: "Удаление файла",
              disciplineAllias: disciplineAllias,
              file: fileInfo,
              errorMessage: ""
            }, "file_delete", 0, 0);
          }
      });
    });
  }
}
