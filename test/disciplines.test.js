const expect = require('chai').expect,
  disciplines = require('../templates/test/processors/disciplines.js'),
  mongodb = require('mongodb'),
  ObjectID = require('mongodb').ObjectID,
  testMongoURL = 'mongodb://localhost:27017/test_amsp';

  const discForInsert = {
    name:'Машинное обучение',
    mnemo:'МО',
    allias:'machine-learning',
    description:'',
    creator:'5e6f4c06aa53d9068f28b35b',
    dateCreate: '2020-03-25T13:48:36.071Z',
    dateUpdate:'2020-04-09T07:08:56.601Z',
    lastEditor: '5e6f4c06aa53d9068f28b35b',
    editors:['5e6f4f587c1479069d229ac6'],
    groups:['5e7ccd6edbd19c03f888514b'],
    files:['zKSbkeF4Dx9wHPnA']
  };

  const groupForInsert = {
    _id: new ObjectID('5e7ccd6edbd19c03f888514b'),
    name: 'УВА',
    course: '3',
    fullname: 'УВА-311',
    url: 'UVA-311',
    typeEducation: 'Бакалавриат',
    elder: ''
  };

  const usersForInsert = {
    _id: new ObjectID('5e6f4f587c1479069d229ac6'),
    email: 'sasha.podshivalov@yandex.ru',
    phone: '',
    lastName: 'Подшивалов',
    name: 'Александр',
    fatherName: 'Павлович',
    username: 'swenkal16',
    password: '5f4dcc3b5aa765d61d8327deb882cf99',
    accountCreated: new Date(),
    passwordChanged: new Date(),
    passwordChangesHistory: [],
    loginHistory: ['swenkal'],
    bannedTill: null,
    bannedReason: null,
    securityGrants: [],
    securityRole: ['teacher'],
    personalDataUsageAgreed: new Date(),
    accountActivated: new Date(),
    passwordReset: false
  };
  describe('Try testing disciplines', () => {
    before(() => {
    mongodb.connect(testMongoURL, (err, conn) => {
      if(err) console.log(err);
      db = conn;
      db.collection('disciplines').insertOne(discForInsert, err => {
        if(err) console.log(`Err when insert discipline: ${err}`);
        db.collection('groups').insertOne(groupForInsert, err => {
          if(err) console.log(`Err when insert group: ${err}`);
          db.collection('users').insertOne(usersForInsert, err => {
            if(err) console.log(`Err when insert user: ${err}`);
          });
        });
      });
    });
    });
    after(() => {
      db.collection('disciplines').deleteOne({ allias: 'machine-learning' }, err => {
        if(err) console.log(`Err when delete discipline: ${err}`);
        db.collection('groups').deleteOne({ url: 'UVA-311' }, err => {
          if(err) console.log(`Err when delete group: ${err}`);
          db.collection('users').deleteOne({ username : 'swenkal16' }, err => {
            if(err) console.log(`Err when delete user: ${err}`);
            db.close();
          });
        });
      });
    });
    it('Try to exec disciplines.processor', (done) => {
      const sessionContext = { id : '5e6f4f587c1479069d229ac6'},
        sessionToken = '5e6f4f587c1479069d229ac6',
        request = {},
        response = {};
        disciplines.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) => {
            console.log(JSON.stringify(processedData));
            console.log(sheathName);
            done();
          }, sessionContext, sessionToken, db);
    });
  });
