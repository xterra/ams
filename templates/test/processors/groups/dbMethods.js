const ObjectID = require('mongodb').ObjectID;

module.exports = {
  getRoleForAuthedUser,
  getGroupListWithElderInfo,
  findGroupByUrl,
  getUserListForGroup,
  updateGroupInfoByUrl
}

/*COMMON METHODS*/
function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback );
}

function getGroupListWithElderInfo(db, callback) {
  db.collection('groups').aggregate([
    {
      $lookup:
       {
         from: 'users',
         let: { elder: '$elder' },
         pipeline: [
           { $match:
             { $expr:
               { $eq: ['$_id', '$$elder'] }
             }
           },
           { $project: { lastName: 1, name: 1 } },
         ],
         as: 'elderInfo'
       }
    }
  ])
  .sort({ course: -1 })
  .toArray(callback);
}

function findGroupByUrl(groupURL, db, callback) {
  db.collection('groups').findOne(
    { url: groupURL },
    callback);
}

function getUserListForGroup(groupInfo, db, callback) {
    db.collection('users').find(
      { group: groupInfo._id },
      { lastName: 1, name: 1 })
      .toArray(callback);
}

function updateGroupInfoByUrl(groupURL, newData, db, callback) {
  db.collection('groups').findOneAndUpdate(
    { url: groupURL },
    { $set: {
        name: newData.name,
        course: newData.course,
        fullname: newData.fullname,
        url: newData.url,
        typeEducation: newData.typeEducation,
        elder: new ObjectID(newData.elder)
      }
    },
    callback);
}
