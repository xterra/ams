const fs = require("fs"),
      router = require('../../../router'),
      formidable = require('formidable');
module.exports= {
  path: new RegExp("^\/upload\/$"),
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
      const userInfo = result;
      return db.collection("disciplines").find({},{name: 1, allias: 1, editors: 1}).toArray(function(err, result){ //Надо ли ставить здесь RETURN
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        const disciplines = result;
        if( !(userInfo.securityRole.includes("superadmin")) && !(userInfo.securityRole.includes("teacher")) ){
          callback();
          return router.bleed(301, "/disciplines/", response);
        }
        let availableDisc= [];
        if(userInfo.securityRole == "teacher"){
          for(let disc of disciplines){
            if(disc.editors !== undefined && disc.editors.includes(userInfo._id.toString())){
              availableDisc.push(disc);
            }
          }
          if(availableDisc.length == 0){
            callback();
            return router.bleed(301, "/disciplines/", response);
          }
        } else{
          availableDisc = disciplines;
        }
        if(request.method == "POST"){
          const PATH_TO_FILES = "D:/1_swenkal/Projects/ams/data/private/files";
          let form = new formidable.IncomingForm();
          let randomFileName = generateRandomString();
          let dirName = randomFileName.substr(0,2);
          let pathToCurrentFile = `${PATH_TO_FILES}/${dirName}`;
          try{
            fs.mkdirSync(pathToCurrentFile);
          } catch(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          form.uploadDir = pathToCurrentFile;
          form.parse(request, function(err, fields, files){
            if(err){
              callback();
              return router.bleed(500, null, response, err);
            }
            console.log("Uploading file");
            let delimeteredFileName = files.myfile.name.split(".");
            let fileExtension = delimeteredFileName[delimeteredFileName.length -1].toLowerCase();
            db.collection("files").insertOne({
              _id: randomFileName,
              name: fields.filename,
              ext: fileExtension,
              size: files.myfile.size,
              type: files.myfile.type,
              comment: fields.comment,
              creator: userInfo._id,
              dateCreate: new Date(),
              editor: userInfo._id,
              dateEdit: new Date()
            }, function(err) {
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log(`Info for file ${randomFileName} added to DB`);
            });
          return db.collection("disciplines").update({allias: fields.discipline},{$push: {files: randomFileName}}, function(err){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log(`File ${randomFileName} added to discipline ${fields.discipline}`);
              return callback({
                title: "Upload file",
                disciplines: availableDisc,
                userInfo: userInfo,
                message: `File uploaded to the server. Added to discipline ${fields.discipline}`,
                currentDisc: fields.discipline
              }, "upload", 0, 0);
            });
          });
          form.on("file", function(err, file){
            fs.rename(file.path, `${pathToCurrentFile}/${randomFileName}`, (err) =>{
              if(err) {
                console.log(`Something wrong with rename ${file.name}: err`);
                return;
              }
              console.log(`File ${file.name} renamed for - ${randomFileName}`);
            });
          });
        } else{
          return callback({
            title: "Upload file",
            disciplines: availableDisc,
            userInfo: userInfo,
            message: ""
          }, "upload", 0, 0);
        }
      });
    });
  }
}

function generateRandomString(length){
   let lengthString = length || 16;
   let resultString = '';
   let randNum;
   while( lengthString-- ){
     randNum = Math.floor(Math.random() * 62);
     resultString += String.fromCharCode(randNum + (randNum < 10 ? 48 : randNum < 36 ? 55 : 61))
   }
   return resultString;
}
