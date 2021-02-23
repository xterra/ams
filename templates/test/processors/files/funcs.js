const fs = require('fs'),
      path = require('path');

/*CONST VARS*/
const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ? `${process.env['STORAGE_DATA_LOCATION']}/private` : '',
      PATH_TO_FILES_DIR = STORAGE_DATA_LOCATION || path.join(__dirname, '../../../../', '/data/private'),
      PATH_TO_TMP = path.join(__dirname, '../../../../', '/tmp');

module.exports = {
  getDiscAlliasFromUrl,
  getFileIDFromUrl,
  checkExistPath,
  getDiscAlliasForCreate,
  moveFileFromTmpStorage,
  replaceFileFromTmpStorage,
  deleteFileFromServer,
  deleteDirFromServer
}
/* COMMON FUNCS*/
function getDiscAlliasFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 3];
}

function getFileIDFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function checkExistPath(pathForCheck, callback) {
  if( !fs.existsSync(pathForCheck) ) {
    console.log(`${pathForCheck} not existent`);
    return callback(null);
  }
  return callback(pathForCheck);
}
/*CREATE FUNCS*/

function getDiscAlliasForCreate(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}

function moveFileFromTmpStorage(fileID, callback) {
  const dirName = fileID.substr(0,2);
  let pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}`;
  if ( !(fs.existsSync(pathToCurrentFile)) ) {
    fs.mkdirSync(pathToCurrentFile);
  }
  const tempPathToFile = `${PATH_TO_TMP}/${fileID}`;
  checkExistPath(tempPathToFile, (checkedPath) => {
    if(checkedPath == null) {
      const err = new Error('File not exist in TMP storage');
      return callback(err);
    }
    fs.rename(checkedPath, `${pathToCurrentFile}/${fileID}`, callback);
  });
}
/*EDIT FUNCS*/
function replaceFileFromTmpStorage(tmpFileID, fileID, callback) {
  let dirName = fileID.substr(0,2);
  let pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}/${fileID}`;
  let tempPathToFile = `${PATH_TO_TMP}/${tmpFileID}`;
  checkExistPath(tempPathToFile, (checkedPath) => {
    if(checkedPath == null) {
      const err = new Error('File not exist in TMP storage');
      return callback(err);
    }
    fs.rename(checkedPath, pathToCurrentFile, callback);
  });
}

/* DELETE FUNCS */
function deleteFileFromServer(pathToCurrentFile, callback) {
  checkExistPath(pathToCurrentFile, (checkedPath) => {
    if(checkedPath == null) return callback(null);
    return fs.unlink(checkedPath, callback);
  });
}

function deleteDirFromServer(pathToCurrentDir, callback) {
  fs.readdir(pathToCurrentDir, (err, files) => {
    if(err) return callback(err);
    if( !files.length ){
      fs.rmdir(pathToCurrentDir, (err) => {
        if(err) return callback(err);
        return callback(null);
      });
    }
  });
}
