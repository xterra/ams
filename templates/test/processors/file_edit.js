const formidable = require('formidable'),
      fs = require('fs'),
      router = require('../../../router'),
      qs = require('querystring');
module.exports = {
  path: new RegExp("^\/file\/edit\/[^\/]+\/[^\/]+$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    db.collection("users").findOne({username: sessionContext.login}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      let userInfo = result;
      if(userInfo.securityRole.length == 0 || (!userInfo.securityRole.includes("superadmin") && !userInfo.securityRole.includes("teacher"))){
        callback();
        return router.bleed(403, null, response);
      }
      let requestedUrl = decodeURI(request.url);
      let delimeteredUrl = requestedUrl.split("/");
      const requestFileName = delimeteredUrl[delimeteredUrl.length - 1];
      let disciplineAllias = delimeteredUrl[delimeteredUrl.length - 2];
      console.log(requestFileName);
      return db.collection("disciplines").findOne({allias: disciplineAllias}, {allias: 1, name: 1}, function(err, result){
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        if(result == null){
          callback();
          console.log(`File not found: ${requestFileName}`);
          return router.bleed(400, null, response);
        }
        const discpline = result;
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
            let requestContentType = request.headers['content-type'];
            let firstPartContentType = requestContentType.split(";")[0];
            if(firstPartContentType == "application/x-www-form-urlencoded"){
              console.log(`Update without overwriting the file.... ${requestFileName}`);
              return router.downloadClientPostData(request, function(err, data){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                try{
                  const  editedFileInfo = qs.parse(data);
                  return db.collection("files").findOneAndUpdate({_id: requestFileName}, {$set: {
                    name: editedFileInfo.filename,
                    comment: editedFileInfo.comment,
                    editor: userInfo._id,
                    dateEdit: new Date()
                  }}, function(err, result){
                    if(err){
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if(result.value == null){
                      return callback({
                        title: "Edit File",
                        fileInfo: editedFileInfo,
                        discpline: discpline,
                        userInfo: userInfo,
                        errorMessage: "Something wrong with update - try again."
                      }, "file_edit", 0, 0);
                    }
                    console.log(`File info ${requestFileName} updated!`);
                    callback();
                    return router.bleed(301, `/disciplines/${disciplineAllias}`, response);
                  });
                } catch(err){
                  callback();
                  return bleed(500, null, response, err);
                }
              });
            }
            if(firstPartContentType == "multipart/form-data"){
              const PATH_TO_FILES = "D:/1_swenkal/Projects/ams/data/private/files";
              let form = new formidable.IncomingForm();
              let dirName = requestFileName.substr(0,2);
              let pathToCurrentFile = `${PATH_TO_FILES}/${dirName}`;

              form.uploadDir = pathToCurrentFile;
              form.parse(request, function(err, fields, files){
                if(err){
                  callback();
                  return router.bleed(500, null, response, err);
                }
                console.log("Refreshing file");
                let delimeteredFileName = files.myfile.name.split(".");
                let fileExtension = delimeteredFileName[delimeteredFileName.length -1];
                db.collection("files").update({_id: requestFileName},{ $set:{
                  name: fields.filename,
                  ext: fileExtension,
                  size: files.myfile.size,
                  type: files.myfile.type,
                  comment: fields.comment,
                  editor: userInfo._id,
                  dateEdit: new Date()
                }}, function(err) {
                  if(err){
                    callback();
                    return router.bleed(500, null, response, err);
                  }
                  console.log(`Info for file ${requestFileName} updated in DB`);
                  callback();
                  return router.bleed(301, `/disciplines/${disciplineAllias}`, response);
                });
              });
              form.on("file", function(err, file){
                fs.rename(file.path, `${pathToCurrentFile}/${requestFileName}`, (err) =>{
                  if(err) {
                    console.log(`Something wrong with rename ${file.name}: err`);
                    return;
                  }
                  console.log(`File ${file.name} renamed for - ${requestFileName}`);
                });
              });
            }
          } else {
            return callback({
              title: "Edit File bl",
              fileInfo: fileInfo,
              discpline: discpline,
              userInfo: userInfo,
              errorMessage: ""
            }, "file_edit", 0, 0);
          }
        });
      });
    });
  }
}
