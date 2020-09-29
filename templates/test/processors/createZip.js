const qs = require('querystring'),
      archiver = require('archiver'),
      router = require('../../../router.js'),
      path = require('path');

module.exports = {
  path : new RegExp('^\/createZip\/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    const userAuthed = isUserAuthed(sessionContext, sessionToken);
    if(!userAuthed) return redirectToLoginPage(response, callback);

    if(request.method == 'POST'){
      router.downloadClientPostData(request, (err, data) => {
        if(err) return edirectTo400Page(response, callback);
        try {
          const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '';
          const PATH_TO_FILES = STORAGE_DATA_LOCATION || '/Users/ksndr/Projects/ams/data/private';
          let postData = qs.parse(data);
          const filesFromClient = postData.files.map(curFile => {
            curFile = JSON.parse(curFile);
            curFile.fullPath = `${PATH_TO_FILES}${curFile.fullPath}`;
            return curFile;
          });

          response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': 'attachment; filename=myFile.zip'
          });
          const zip = archiver('zip');

          zip.pipe(response);
          for(let curFile of filesFromClient) {
            zip.file(curFile.fullPath, { name: curFile.fullName });
          }
          zip.finalize();

          zip.on('end', function() {
            console.log('Archive wrote %d bytes', zip.pointer());
          });
        } catch(err) {
          return redirectTo500Page(response,callback, err);
        }
      });
    } else {
      return redirectTo404Page(response,callback);
    }
  }
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function redirectToLoginPage(response, callback) {
  callback();
  return router.bleed(301, '/login/', response);
}

function redirectTo404Page(response, callback) {
  callback();
  return router.bleed(404, null, response);
}

function redirectTo400Page(response, callback) {
  callback();
  return router.bleed(400, null, response);
}

function redirectTo500Page(response, callback, err) {
  callback();
  return router.bleed(500, null, response, err);
}
