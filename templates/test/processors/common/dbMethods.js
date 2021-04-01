const ObjectID = require('mongodb').ObjectID;

module.exports = {
  getLastThreeNews,
  findAllNewsWithAuthor,
  getRoleForAuthedUser,
}

/*HOME processor*/
function getLastThreeNews(db, callback) {
  db.collection('news').find().sort({ dateCreate: -1 })
      .limit(3).toArray(callback);
}

/*NEWS processor*/
function findAllNewsWithAuthor(db, callback) {
  db.collection('news').aggregate([
     {
       $lookup:
         {
           from: 'users',
           let: { author: '$author' },
           pipeline: [
             { $match:
                {$expr:
                 { $eq: [{ $toString: '$_id' }, '$$author']  }
                }
             },
             { $project:
               { _id: 0, lastName: 1, name: 1, fatherName: 1, securityRole: 1 }
             },
           ],
           as: 'authorInfo'
         }
      },
  ]).sort({ dateCreate: -1 }).toArray(callback);
}

function getRoleForAuthedUser(userID, db, callback) {
  db.collection('users').findOne(
    { _id: new ObjectID(userID) },
    { _id: 1, securityRole: 1 },
    callback );
}
