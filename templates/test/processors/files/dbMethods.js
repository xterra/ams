const ObjectID = require('mongodb').ObjectID;

module.exports = {
  getRoleForAuthedUser,
  findDisciplineByAllias,
  getFileInfoById,
  addFileInfoToDB,
  addFileIdToDiscipline,
  updateFileNameAndComment,
  updateFileInfoById,
  deleteFileFromDB,
  deleteFileFromDiscipline
}

/*COMMON METHODS*/
function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback );
}

function findDisciplineByAllias(disciplineAllias, db, callback) {
  db.collection('disciplines').findOne(
    { allias: disciplineAllias },
    { name: 1, allias: 1, editors: 1 },
    callback );
}

function getFileInfoById(fileID, db, callback) {
  db.collection("files").findOne(
    { _id: fileID },
    callback );
}

/*CREATE METHODS*/
function addFileInfoToDB(postData, userInfo, db, callback) {
  db.collection('files').insertOne({
    _id: postData.fileID,
    name: postData.filename,
    ext: postData.fileExt,
    size: postData.fileSize,
    type: postData.fileType,
    comment: postData.comment,
    creator: userInfo._id,
    dateCreate: new Date(),
    editor: userInfo._id,
    dateEdit: new Date()
  }, callback);
}

function addFileIdToDiscipline(disciplineAllias, fileID, db, callback) {
  db.collection('disciplines').update(
    { allias: disciplineAllias },
    { $push: { files: fileID } },
    callback);
}
/*EDIT METHODS*/
function updateFileNameAndComment(fileID, editedFileInfo, userInfo, db, callback) {
  db.collection("files").findOneAndUpdate(
    { _id: fileID },
    { $set: {
        name: editedFileInfo.filename,
        comment: editedFileInfo.comment,
        editor: userInfo._id,
        dateEdit: new Date()
      }
    }, callback);
}

function updateFileInfoById(fileID, editedFileInfo, userInfo, db, callback) {
  db.collection("files").findOneAndUpdate(
    { _id: fileID },
    { $set: {
        name: editedFileInfo.filename,
        ext: editedFileInfo.fileExt,
        size: editedFileInfo.fileSize,
        type: editedFileInfo.fileType,
        comment: editedFileInfo.comment,
        editor: userInfo._id,
        dateEdit: new Date()
      }
    }, callback);
}

/*DELETE METHODS*/
function deleteFileFromDB(fileID, db, callback) {
  db.collection("files").deleteOne(
    { _id: fileID },
    callback );
}

function deleteFileFromDiscipline(disciplineAllias, fileID, db, callback) {
  db.collection("disciplines").update(
    { files: fileID },
    { $pull: {
        files: fileID
      }
    }, callback );
}
