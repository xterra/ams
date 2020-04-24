const fs = require("fs"),
      router = require('../../../router'),
      formidable = require('formidable'),
      ini = require('ini'),
      path = require('path');
module.exports= {
  path: new RegExp("^\/file\/upload\/[^\/]+\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    if(sessionToken == null || sessionContext == undefined || sessionContext == null){
      callback();
      return router.bleed(301, "/login/", response);
    }
    let requestedURL = decodeURI(request.url);
    let delimeteredURL = requestedURL.split('/')
    let disciplineAllias = delimeteredURL[delimeteredURL.length-2];
    console.log(disciplineAllias);
    db.collection("users").findOne({_id: sessionContext.id}, {username: 1, securityRole: 1}, function(err, result){
      if(err){
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      return db.collection("disciplines").findOne({allias: disciplineAllias},{name: 1, allias: 1, editors: 1}, function(err, result){ //Надо ли ставить здесь RETURN
        if(err){
          callback();
          return router.bleed(500, null, response, err);
        }
        const discipline = result;
        if( !(userInfo.securityRole.includes("superadmin")) && !(userInfo.securityRole.includes("teacher")) ){
          callback();
          return router.bleed(301, "/disciplines/", response);
        }
        if(userInfo.securityRole == "teacher" && !discipline.editors.includes(userInfo._id.toString())) {
            callback();
            return router.bleed(301, "/disciplines/", response);
        }
        if(request.method == "POST"){
          const storageConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, "../../../" , "configurations", "storage.ini"), "utf-8"));
          console.log(storageConfigurations['data']['location']);
          const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
          console.log(`STORAGE_DATA_LOCATION: ${STORAGE_DATA_LOCATION}`);
          const PATH_TO_FILES = STORAGE_DATA_LOCATION || storageConfigurations['data']['location'] || path.join(__dirname, "../../../", "/data/private");
          let form = new formidable.IncomingForm();
          let randomFileName = generateRandomString();
          let dirName = randomFileName.substr(0,2);
          let pathToCurrentFile = `${PATH_TO_FILES}/${dirName}`;
          try{
            if (!(fs.existsSync(pathToCurrentFile))) {
              fs.mkdirSync(pathToCurrentFile);
            }
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
          return db.collection("disciplines").update({allias: disciplineAllias},{$push: {files: randomFileName}}, function(err){
              if(err){
                callback();
                return router.bleed(500, null, response, err);
              }
              console.log(`File ${randomFileName} added to discipline ${disciplineAllias}`);
              return callback({
                title: "Загрузка файла",
                discipline: discipline,
                userInfo: userInfo,
                message: `Файл загружен. Добавлен к "${discipline.name}"`,
              }, "file_upload", 0, 0);
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
            title: "Загрузка файла",
            discipline: discipline,
            userInfo: userInfo,
            message: ""
          }, "file_upload", 0, 0);
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
