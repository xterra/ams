const fs = require('fs'),
      path = require('path');
module.exports = {
  path: new RegExp('^/upload/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {

    if(request.method == 'POST') {
      const PATH_TO_TMP = path.join(__dirname, '../../../tmp');
      const randomFileName = generateRandomString();
      const fullFilePath = `${PATH_TO_TMP}/${randomFileName}`;
      request.pipe( fs.createWriteStream(fullFilePath) )
        .on('finish', () => {
          callback();
          response.end(randomFileName);
        });
    }
  }
};

function generateRandomString(length) {
   let lengthString = length || 16;
   let resultString = '';
   let randNum;
   while( lengthString-- ){
     randNum = Math.floor(Math.random() * 62);
     resultString += String.fromCharCode(randNum + (randNum < 10 ? 48 : randNum < 36 ? 55 : 61))
   }
   return resultString;
}
