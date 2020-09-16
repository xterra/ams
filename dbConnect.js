let db = null;
const dbDetails = {},
  localIP =  '0.0.0.0',
  ip = process.env.IP || localIP;

module.exports = {
  initDb,
  getDB() {
    return db;
  },
  isConnected() {
    return db !== null;
  }
};

let localMongoURL = 'mongodb://localhost:27017/amsp',
 mongoURL = process.env.MONGO_URL || process.env.MONGO_TEST || localMongoURL;

function initDb(callback) {

  if (mongoURL === null) return callback(new Error('Mongo URL is not specified!'));

  const mongodb = require('mongodb');
  if (mongodb === null) return callback(new Error('Mongo module is not connected!'));

  return mongodb.connect(mongoURL, (err, conn) => {
    if (err) {
      callback(err);
      return;
    }

    db = conn;

    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURL;
    dbDetails.type = 'MongoDB';

    console.log('Configs, DB connection url:\t\t', dbDetails.url);
    console.log('Configs, DB database name:\t\t', dbDetails.databaseName);
    console.log('Configs, DB type:\t\t\t\t', dbDetails.type);

    if (ip === '0.0.0.0') {
      console.log('Checking DB demo data...');

      return db.createCollection('sessions', null, error => {
        if (error) return callback(error);
        // TODO: make indexes
        db.createCollection('users', null, (error, createdUsersCollection) => {
          if (error) return callback(error);
          createdUsersCollection.findOne({
            username: 'admin'
          }, { _id: 1 }, null, (error, foundData) => {
            if (error) return callback(error);
            if (foundData) {
              console.info('Demo-admin user is already exists!');
              return callback(null);
            } else {
              createdUsersCollection.insertOne({
                email: 'admin@example.org',
                phone: 12345678901,
                username: 'admin',
                password: '5f4dcc3b5aa765d61d8327deb882cf99',
                accountCreated: new Date(),
                passwordChanged: new Date(),
                passwordChangesHistory: [],
                loginHistory: [],
                bannedTill: null,
                bannedReason: null,
                securityGrants: [],
                securityRole: ['superadmin'],
                personalDataUsageAgreed: new Date(),
                accountActivated: new Date()
              }, null, (error, result) => {
                if (!error) {
                  console.info('Demo-admin user successfully created!');
                } else if (result.result.ok === 1) {
                  console.warn('Can\'t create new demo-admin user!');
                } else {
                  return callback(new Error('Unknown problem: db insert is non-ok'));
                }
                callback(error);
              });
            }
          });
        });
      });
    } else {
      callback(null);
    }
  });
}
