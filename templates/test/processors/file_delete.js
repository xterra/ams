const fs = require("fs"),
      router = require('../../../router');
module.exports = {
  path: new RegExp("^\/file\/delete\/[^\/]+\/[^\/]+$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username: sessionContext.login},{username: 1, securityRole: 1}, function(err, result){
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
      let requestFileName = delimeteredUrl[delimeteredUrl.length - 1];
      let disciplineAllias = delimeteredUrl[delimeteredUrl.length - 2];
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
            const PATH_TO_FILES = "D:/1_swenkal/Projects/ams/data/private/files";
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
                title: "Delete file",
                userInfo: userInfo,
                file: fileInfo,
                errorMessage: "Something wrong with deleting file."
              }, "file_delete", 0, 0);
            }
          return db.collection("disciplines").update({files: requestFileName}, {$pull: { files: requestFileName}}, function(err){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              callback();
              return router.bleed(301, `/disciplines/${disciplineAllias}`, response);
            });
          } else{
            return callback({
              title: "Delete file",
              userInfo: userInfo,
              file: fileInfo,
              errorMessage: ""
            }, "file_delete", 0, 0);
          }
      });
    });
  }
}
