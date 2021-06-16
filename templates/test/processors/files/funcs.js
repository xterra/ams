const fs = require('fs'),
      path = require('path');

/*CONST VARS*/
const STORAGE_DATA_LOCATION = process.env['STORAGE_DATA_LOCATION'] ?
                        `${process.env['STORAGE_DATA_LOCATION']}/private` : '',
      PATH_TO_FILES_DIR = STORAGE_DATA_LOCATION ||
                          path.join(__dirname, '../../../../', '/data/private'),
      STORAGE_TMP_LOCATION = process.env['STORAGE_TMP_LOCATION'],
      PATH_TO_TMP = STORAGE_TMP_LOCATION ||
                    path.join(__dirname, '../../../../', '/tmp');

module.exports = {
  getDiscAlliasFromUrl,
  getFileIDFromUrl,
  checkExistPath,
  getDiscAlliasForCreate,
  moveFileFromTmpStorage,
  replaceFileFromTmpStorage,
  deleteFileFromServer,
  deleteDirIfEmpty
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
    fs.copyFile(checkedPath, `${pathToCurrentFile}/${fileID}`, err => {
      fs.unlink(checkedPath, callback);
    });
  });
}

/*EDIT FUNCS*/
function replaceFileFromTmpStorage(tmpFileID, fileID, callback) {
  let dirName = fileID.substr(0,2);
  let pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}/${fileID}`;
  let tempPathToFile = `${PATH_TO_TMP}/${tmpFileID}`;
  checkExistPath(tempPathToFile, (checkedPath) => {
    if (checkedPath == null) {
      const err = new Error('File not exist in TMP storage');
      return callback(err);
    }
    fs.copyFile(checkedPath, pathToCurrentFile, err => {
      fs.unlink(checkedPath, callback);
    });
  });
}

/* DELETE FUNCS */
function deleteFileFromServer(fileID, callback) {
  const dirName = fileID.substr(0, 2);
  const pathToCurrentFile = `${PATH_TO_FILES_DIR}/${dirName}/${fileID}`;
  checkExistPath(pathToCurrentFile, (checkedPath) => {
    if (checkedPath == null) return callback(null);
    return fs.unlink(checkedPath, callback);
  });
}

function deleteDirIfEmpty(dirName, callback) {
  const pathToCurrentDir = `${PATH_TO_FILES_DIR}/${dirName}`;
  fs.readdir(pathToCurrentDir, (err, files) => {
    if (err) return callback(err);
    if (files.length) return callback(null);
    fs.rmdir(pathToCurrentDir, (err) => {
      if (err) return callback(err);
      return callback(null);
    });
  });
}
