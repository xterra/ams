const expect = require('chai').expect,
  security = require('../security.js'),
  dbConnect = require('../dbConnect.js'),
  ini = require('ini'),
  fs = require('fs'),
  path = require('path'),
  router = require('../router.js');
  sinon = require('sinon');

describe('\nTesting security.js\n', () => {

  //turn off console output (stub it)
  before( () => {
    sinon.stub(console, 'log').returns(null);
    sinon.stub(console, 'error').returns(null);
    sinon.stub(console, 'warn').returns(null);
  });
  after( () => {
    console.log.restore();
    console.error.restore();
    console.warn.restore();
  });

//getSessionData
  describe('\nfunc getSessionData()\n', () => {
    describe('check passing existent token', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                const result = {
                  data : {},
                  ownerID : '5e6f4f587c1479069d229ac6'
                };
                return callback(null, result);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('passing sessionToken="12345678901" => Expect sessionData with key "id"', (done) => {
        const sessionToken = '12345678901',
          resultOwnerID = '5e6f4f587c1479069d229ac6';
        security.getSessionData(sessionToken, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.have.property('id');
          expect(result.id).to.equal(resultOwnerID);
          done();
        });
      });
    });
    describe('check passing non-existent token', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                return callback(null, null);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('passing sessionToken="" => expect callback values (err, result) = null', (done) => {
        const sessionToken = '';
        security.getSessionData(sessionToken, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.null;
          done();
        });
      });
    });
    describe('check passing bad token', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                const error = new Error('Uncorrect _id value!');
                return callback(error);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('passing sessionToken=1235432 => Expect error "Uncorrect _id value!"', (done) => {
        const sessionToken = 1235432,
          errorMsg = 'Uncorrect _id value!';
        security.getSessionData(sessionToken, (err, result) => {
          expect(err).to.be.an('error');
          expect(err.message).to.equal(errorMsg);
          done();
        });
      });
    });
  });

//getSessionFromCookies
  describe('\nfunc getSessionFromCookies()\n', () => {
    describe('check passing uncorrect rawCookies', () => {
      it('pass rawCookies=123 expect error in callback', (done) => {
        const rawCookies = 123;
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.an('error');
          done();
        });
      });

      it('pass rawCookies="foobar" expect callback = null, null', (done) => {
        const rawCookies = 'foobar';
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.null;
          expect(sessionToken).to.be.null;
          done();
        });
      });

      it('pass rawCookies="" expect callback = null, null', (done) => {
        const rawCookies = '';
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.null;
          expect(sessionToken).to.be.null;
          done();
        });
      });
    });

    describe('check passing existent, correct rawCookies', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                const result = {
                  data : {},
                  ownerID : '123'
                };
                return callback(null, result);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('pass rawCookies="SESSID=1235431" => expect sessionToken="1235431" and sessionData with key "id"', (done) => {
        const rawCookies = 'SESSID=1235431';
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.null;
          expect(sessionToken).to.equal('1235431');
          expect(sessionData).to.have.property('id');
          expect(sessionData.id).to.equal('123');
          done();
        });
      });
    });

    describe('check passing correct rawCookies, but non-existent in Mongo', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                const result = null;
                return callback(null, result);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('pass rawCookies="SESSID=111" => expect sessionToken=false and sessionData=null', (done) => {
        const rawCookies = 'SESSID=111';
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.null;
          expect(sessionToken).to.be.false;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('check passing correct rawCookies, where sessionData={} in Mongo', () => {
      before(() => {
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (findRule, callback) => {
                const result = {
                  data : {},
                  ownerID : '123'
                };
                return callback(null, result);
              }
            }
          }
        }
        let dbConnectStub = sinon.stub(dbConnect, 'getDB');
        dbConnectStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('pass rawCookies="SESSID=1235432" => expect sessionToken=123 and sessionData={ id : "123"}', (done) => {
        const rawCookies = 'SESSID=1235432';
        security.getSessionFromCookies(rawCookies, (err, sessionToken, sessionData) => {
          expect(err).to.be.null;
          expect(sessionToken).to.equal('1235432');
          expect(sessionData).to.have.property('id');
          expect(sessionData.id).to.equal('123');
          done();
        });
      });
    });
  });

//getSessionFromRequest
  describe('\nfunc getSessionFromRequest()\n', () => {
    describe('pass with empty request.headers', () => {

      it('pass request = { headers: {} } expect callback(null,null)', (done) => {
        const request = {
          headers: {}
        };
        const response = {},
          restrictHeadersChange = false;
        security.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
          expect(sessionToken).to.be.null;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('pass correct request, response; but uncorrect restrictHeadersChange', () => {
      let routerMock = sinon.mock(router);

      before( () => {
        let getSessionFromCookiesFn = (rawCookies, callback) => {
          const sessionToken = '1235431',
            sessionData = { id : '123'};
          return callback(null, sessionToken, sessionData);
        }
        let getSessionFromCookiesStub = sinon.stub(security, 'getSessionFromCookies').callsFake(getSessionFromCookiesFn);
      });

      after( () => {
        security.getSessionFromCookies.restore();
        routerMock.restore();
      });

      it('pass request.headers.cookie="SESSID=123", restrictHeadersChange="messi" expect call response.setHeader', (done) => {
        let request = {
          headers : {
            cookie : 'SESSID=123'
          }
        };
        let response = {
          setHeader() {
            console.log('\n Response setHeader property');
          }
        };
        const restrictHeadersChange = 'messi';
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').once();
        routerMock.expects('bleed').never();

        security.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          expect(sessionToken).to.equal('1235431');
          expect(sessionData).to.have.property('id');
          done();
        }, restrictHeadersChange);
      });
    });

    describe('pass arguments which return error', () => {
      let routerMock = sinon.mock(router);
      before( () => {
        let getSessionFromCookiesFn = (rawCookies, callback) => {
          const error = new Error('Uncorrect data'),
            sessionToken = false,
            sessionData = null;
          return callback(error, sessionToken, sessionData);
        }
        let getSessionFromCookiesStub = sinon.stub(security, 'getSessionFromCookies').callsFake(getSessionFromCookiesFn);
      });

      after( () => {
        security.getSessionFromCookies.restore();
        routerMock.restore();
      });
      it('pass bad rawCookies="SESSID;1234;1234dsfs,/c" expect call router.bleed', () => {
        const request = {
          headers: {
            cookie: 'SESSID;1234;1234dsfs,/c'
          }
        };
        const response = {
          setHeader(){
            console.log('Call response.setHeader');
          }
        };
        const expectedError = new Error('Uncorrect data'),
          restrictHeadersChange = false;
        routerMock.expects('bleed').once().withArgs(500, null, response, sinon.match.any);
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').never();
        security.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          responseMock.restore();
          console.log(`sessionToken: ${sessionToken}, sessionData: ${sessionData}`);
        }, restrictHeadersChange);
      });

    });

    describe('pass existent cookie from request', () => {
      let routerMock = sinon.mock(router);
      before( () => {
        let getSessionFromCookiesFn = (rawCookies, callback) => {
          sessionToken = '1235431';
          sessionData = { id : '123'};
          return callback(null, sessionToken, sessionData);
        }
        let getSessionFromCookiesStub = sinon.stub(security, 'getSessionFromCookies').callsFake(getSessionFromCookiesFn);
        routerMock.expects('bleed').never();
      });
      after( () => {
        security.getSessionFromCookies.restore();
        routerMock.restore();
      });
      it('pass request.headers.cookie="SESSID=123" expect call response.setHeader() and returns correct session Token and Data', (done) => {
        let request = {
          headers : {
            cookie: 'SESSID=123'
            }
          };
        let response = {
          setHeader() {
            console.log('\n Response setHeader property');
          }
        };
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').once();
        security.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          responseMock.restore();
          expect(sessionToken).to.equal('1235431');
          expect(sessionData).to.have.property('id');
          done();
        }, false);
      });
    });

    describe('pass existent cookie and restrictHeadersChange="true"', () => {
      let routerMock = sinon.mock(router);

      before( () => {
        let getSessionFromCookiesFn = (rawCookies, callback) => {
          const sessionToken = '1235431',
            sessionData = { id : '123'};
          return callback(null, sessionToken, sessionData);
        }
        let getSessionFromCookiesStub = sinon.stub(security, 'getSessionFromCookies').callsFake(getSessionFromCookiesFn);
      });

      after( () => {
        security.getSessionFromCookies.restore();
        routerMock.restore();
      });

      it('expect NOcall response.setHeader and router.bleed ', (done) => {
        let request = {
          headers : {
            cookie : 'SESSID=123'
          }
        };
        let response = {
          setHeader() {
            console.log('\n Response setHeader property');
          }
        };
        const restrictHeadersChange = true;
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').never();
        routerMock.expects('bleed').never();

        security.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          expect(sessionToken).to.equal('1235431');
          expect(sessionData).to.have.property('id');
          done();
        }, restrictHeadersChange);
      });
    });

  });

//makeSessionUsingToken
  describe('\nfunc makeSessionUsingToken()\n', () => {
    describe('check when db not connected', () => {
      let dbConnectMock = sinon.mock(dbConnect);
      before( () => {
        let dbConnectStub = sinon.stub(dbConnect, 'isConnected');
        dbConnectStub.returns(false);
        dbConnectMock.expects('getDB').never();
      });
      after( () => {
        dbConnect.isConnected.restore();
        dbConnectMock.restore();
      });
      it('pass isConnected=false, token="ddddffff2222tttt", userID="1234567" expect getDB() never called and token, and userID returns', (done) => {
        const token = 'ddddffff2222tttt',
          userID = '1234567';
        security.makeSessionUsingToken(token, userID, (error, resultToken, sessionData, ownerID) => {
          dbConnectMock.verify();
          expect(resultToken).to.equal(token);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(userID);
          expect(ownerID).to.equal(userID);
          done();
        });
      });
    });
    describe('check when db connected and errors in insertOne()', () => {
      before( () => {
        let dbConnectIsConnected = sinon.stub(dbConnect, 'isConnected');
        dbConnectIsConnected.returns(true);
        stubDbCollection = {
          collection: () => {
            return {
              insertOne : (argsForInsert, otherArgs, callback) => {
                const error = new Error('Error in MongoDB'),
                  result = null;
                return callback(error, result);
              }
            }
          }
        }
        let dbConnectGetDB = sinon.stub(dbConnect, 'getDB');
        dbConnectGetDB.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
      });
      it('pass isConnected=true, token="ddddffff2222tttt", userID="ronaldo" expect error.msg="Error in MongoDB" ', (done) => {
        const token = 'ddddffff2222tttt',
          userID = 'ronaldo',
          errorMsg = 'Error in MongoDB';
        security.makeSessionUsingToken(token, userID, (error, resultToken, sessionData, ownerID) => {
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          expect(resultToken).to.be.false;
          expect(sessionData).to.be.null;
          expect(ownerID).to.be.null;
          done();
        });
      });
    });
    describe('check when db connected and correct data without errors', () => {
      before( () => {
        let dbConnectIsConnected = sinon.stub(dbConnect, 'isConnected');
        dbConnectIsConnected.returns(true);
        const stubDbCollection = {
          collection : () => {
            return {
              insertOne : (argsForInsert, otherArgs, callback) => {
                const error = null,
                  result = {
                    ops: [{data: {id: '1234567'} ,ownerID: '1234567'}]
                  };
                return callback(error, result);
              }
            }
          }
        };
        let dbConnectGetDB = sinon.stub(dbConnect, 'getDB');
        dbConnectGetDB.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
      });
      it('pass token="ddddffff2222tttt", userID="1234567" expect correct sessionToken, sessionData', (done) => {
        const token='ddddffff2222tttt',
          userID='1234567';
        security.makeSessionUsingToken(token, userID, (error, resultToken, sessionData, ownerID) => {
          expect(error).to.be.null;
          expect(resultToken).to.equal(token);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(userID);
          expect(ownerID).to.equal(userID);
          done();
        });
      });

    });
  });

//makeSession
  describe('\nfunc makeSession()\n', () => {
    describe('check: db not connected & makeSessionUsingToken correct return', () => {
      before( () => {
        let dbConnectIsConnected = sinon.stub(dbConnect, 'isConnected');
        dbConnectIsConnected.returns(false);
        const makeSessionUsingTokenFn = (token, userID, callback) => {
          const defaultSessionData = { id : userID };
          return callback(null, token, defaultSessionData, userID);
        };
        let makeSessionUsingTokenStub = sinon.stub(security, 'makeSessionUsingToken');
        makeSessionUsingTokenStub.callsFake(makeSessionUsingTokenFn);
      });
      after( () => {
        dbConnect.isConnected.restore();
        security.makeSessionUsingToken.restore();
      });
      it('pass userID="1234dsfs" expect token.length=64, sessionData has "id", id="1234dsfs"', (done) => {
        const userID = '1234dsfs';
        security.makeSession(userID, (error, token, sessionData, ownerID) => {
          expect(error).to.be.null;
          expect(token.length).to.equal(64);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(userID);
          expect(ownerID).to.equal(userID);
          done();
        })
      });
    });

    describe('check: db connected, db Error occurred in generateToken()', () => {
      const securityMock = sinon.mock(security);
      before(() => {
        let dbConnectIsConnected = sinon.stub(dbConnect, 'isConnected');
        dbConnectIsConnected.returns(true);
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = new Error('Bad ObjectID!'),
                  result = null;
                return callback(error, result);
              }
            }
          }
        };
        let dbConnectGetDB = sinon.stub(dbConnect, 'getDB');
        dbConnectGetDB.returns(stubDbCollection);
      });
      after(() => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSessionUsingToken.restore();
      });
      it('pass userID="antoineGriezmann" expect error in generateToken, never call makeSessionUsingToken', (done) => {
        const userID = 'antoineGriezmann';
        const makeSessionUsingTokenMock = securityMock.expects('makeSessionUsingToken').never();
        security.makeSession(userID, (error, token, sessionData, ownerID) => {
          makeSessionUsingTokenMock.verify();
          expect(error).to.be.an('error');
          expect(error.message).to.equal('Bad ObjectID!');
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          expect(ownerID).to.be.null;
          done();
        })
      });
    });

    describe('check: db connected, when 1st generated token exist in DB', () => {
      before(() => {
        let dbConnectIsConnected = sinon.stub(dbConnect, 'isConnected');
        dbConnectIsConnected.returns(true);
        const collectionFn = sinon.stub();
        collectionFn.onCall(0).returns({
          findOne : (searchArgs, filterArgs, callback) => {
            return callback(null, {id : '123'});
          }
        });
        collectionFn.onCall(1).returns({
          findOne : (searchArgs, filterArgs, callback) => {
            return callback(null, null);
          }
        });

        const stubDbCollection = {
          collection : collectionFn
        };

        let dbConnectGetDB = sinon.stub(dbConnect, 'getDB');
        dbConnectGetDB.returns(stubDbCollection);

        const makeSessionUsingTokenFn = (token, userID, callback) => {
          const defaultSessionData = { id : userID };
          return callback(null, token, defaultSessionData, userID);
        };
        let makeSessionUsingTokenStub = sinon.stub(security, 'makeSessionUsingToken');
        makeSessionUsingTokenStub.callsFake(makeSessionUsingTokenFn);

      });
      after(() => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSessionUsingToken.restore();
      });
      it('pass userID="12345678901" expect token.length=64, sessionData have "id", error=null', (done) => {
        const userID = '12345678901';
        security.makeSession(userID, (error, token, sessionData, ownerID) => {
          expect(error).to.be.null;
          expect(token.length).to.equal(64);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(userID);
          expect(ownerID).to.equal(userID);
          done();
        });
      });
    })

    describe('check: db connected, correct result generateToken(), but error in makeSessionUsingToken', () => {
      before(() => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);
        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = null,
                  result = null;
                return callback(error, result);
              }
            }
          }
        }
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);

        const makeSessionUsingTokenFn = (token, userID, callback) => {
          const error = new Error('Save error in Mongo'),
            resultToken = null,
            sessionData = null,
            ownerID =null;
          return callback(error, resultToken, sessionData, ownerID);
        }
        let makeSessionUsingTokenStub = sinon.stub(security, 'makeSessionUsingToken');
        makeSessionUsingTokenStub.callsFake(makeSessionUsingTokenFn);
      });

      after(() => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSessionUsingToken.restore();
      });

      it('pass userID="1234dsfs" expect "Save error" from makeSessionUsingToken', (done) => {
        const userID = '1234dsfs',
          errorMsg = 'Save error in Mongo';
        security.makeSession(userID, (error, token, sessionData, ownerID) => {
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          expect(token).to.be.null;
          expect(sessionData).to.be.null;
          expect(ownerID).to.be.null;
          done();
        });
      });
    });

    describe('check: db connected, no errors in callback values', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);

        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = null,
                  result = null;
                return callback(error, result);
              }
            }
          }
        }
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);

        const makeSessionUsingTokenFn = (token, userID, callback) => {
          const sessionData = { id : userID },
            error = null;
          return callback(error, token, sessionData, userID);
        }
        let makeSessionUsingTokenStub = sinon.stub(security, 'makeSessionUsingToken');
        makeSessionUsingTokenStub.callsFake(makeSessionUsingTokenFn);
      });

      after( () => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSessionUsingToken.restore();
      });
      it('pass userID="12345678901" expect token.length=64, sessionData have "id"', (done) => {
        const userID = '12345678901';
        security.makeSession(userID, (error, token, sessionData, ownerID) => {
          expect(error).to.be.null;
          expect(token.length).to.equal(64);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(userID);
          expect(ownerID).to.equal(userID);
          done();
        });
      });
    });
  });

//loginUsingToken
  describe('\nfunc loginUsingToken()\n', () => {

    describe('check: db not connected and no admin\'s credentials', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(false);
      });
      after( () => {
        dbConnect.isConnected.restore();
      });
      it('pass login="gianluigi", password="buffon" expect error=null, token=false, sessionData=null', (done) => {
        const login = 'gianluigi',
          password = 'buffon';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          expect(error).to.be.null;
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('check: db not connected, but admin credentials', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(false);
        const makeSessionFn = function(userID, callback) {
          const error = null,
            token = '321654987321654987',
            sessionData = { id : userID };
          return callback(error, token, sessionData);
        };
        let makeSessionStub = sinon.stub(security, 'makeSession');
        makeSessionStub.callsFake(makeSessionFn);
      });
      after( () => {
        dbConnect.isConnected.restore();
        security.makeSession.restore();
      });
      it('pass login="admin",password="password" expect error=null, token="321654987321654987", sessionData have "id"', (done) => {
        const login = 'admin',
          password = 'password',
          resultID = '5f4dcc3b5aa765d61d8327deb882cf99',
          resultToken = '321654987321654987';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          expect(error).to.be.null;
          expect(token).to.equal(resultToken);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(resultID);
          done();
        });
      });
    });

    describe('check: db not connected, but error in makeSession for admin', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(false);

        const makeSessionFn = (userID, callback) => {
          const error = new Error('Create error!'),
            token = false,
            sessionData = null;
          return callback(error, token, sessionData);
        }
        let makeSessionStub = sinon.stub(security, 'makeSession');
        makeSessionStub.callsFake(makeSessionFn);
      });
      after(() => {
        dbConnect.isConnected.restore();
        security.makeSession.restore();
      });
      it('pass login="admin", password="password" expect create error', (done) => {
        const login='admin',
          password='password',
          errorMsg = 'Create error!';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('check: db connected, but error in query to DB', () => {
      before(() => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);

        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = new Error('Find error!'),
                  result = null;
                return callback(error, result);
              }
            }
          }
        }

        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);
      });
      after(() => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSession.restore();
      });
      it('pass login="karim", password="benzema" expect find error and NO call makeSession()', (done) => {
        let securityMock = sinon.mock(security),
          makeSessionMock = securityMock.expects('makeSession').never();
        const login = 'karim',
          password = 'benzema',
          errorMsg = 'Find error!';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          makeSessionMock.verify();
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('check: db connected, but not found user with current credentials', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);

        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = null,
                  result = null;
                return callback(error, result);
              }
            }
          }
        };
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);
      });
      after(() => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSession.restore();
      });
      it('pass login="stiven", password="gerrard", expect error,sessionData = null, token=false, makeSession() never calls ', (done) => {
        let securityMock = sinon.mock(security),
          makeSessionMock = securityMock.expects('makeSession').never();
        const login = 'stiven',
          password = 'gerrard';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          makeSessionMock.verify();
          expect(error).to.be.null;
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });

    describe('check: db connected and user exists in DB', () => {
      before(() => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);

        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = null,
                  result = { _id: '1234dsfs'};
                return callback(error, result);
              }
            }
          }
        }
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);

        const makeSessionFn = (userID, callback) => {
          const error = null,
            token = '321654987321654987',
            sessionData = { id : userID};
          return callback(error, token, sessionData);
        }
        let makeSessionStub = sinon.stub(security, 'makeSession');
        makeSessionStub.callsFake(makeSessionFn);
      });
      after( () => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSession.restore();
      });
      it('pass login="swenkal", password="password" expect no errors, correct token and sessionData', (done) => {
        const login = 'swenkal',
          password = 'password',
          resultToken = '321654987321654987',
          resultID = '1234dsfs';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          expect(error).to.be.null;
          expect(token).to.equal(resultToken);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(resultID);
          done();
        });
      });
    });

    describe('check: db connected, but error in makeSession()', () => {
      before( () => {
        let isConnectedStub = sinon.stub(dbConnect, 'isConnected');
        isConnectedStub.returns(true);

        const stubDbCollection = {
          collection : () => {
            return {
              findOne : (searchArgs, filterArgs, callback) => {
                const error = null,
                  result = { _id : '123' };
                return callback(error, result);
              }
            }
          }
        }

        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);

        const makeSessionFn = (userID, callback) => {
          const error = new Error('Error occurred in makeSession()!'),
            token = false,
            sessionData = null;
          return callback(error, token, sessionData);
        };
        let makeSessionStub = sinon.stub(security, 'makeSession');
        makeSessionStub.callsFake(makeSessionFn);
      });
      after( () => {
        dbConnect.isConnected.restore();
        dbConnect.getDB.restore();
        security.makeSession.restore();
      });
      it('pass login="robert" password="lewandovski" expect error in makeSession(), token=false, sessionData=null', (done) => {
        const login = 'robert',
          password = 'lewandovski',
          errorMsg = 'Error occurred in makeSession()!';
        security.loginUsingToken(login, password, (error, token, sessionData) => {
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          expect(token).to.be.false;
          expect(sessionData).to.be.null;
          done();
        })
      });
    });
  });

//loginUsingCookies
  describe('\nfunc loginUsingCookies()\n', () => {

    describe('check: return existen token and sessionData from getSessionFromRequest() ', () => {
      before( () => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = 'ddddffff2222tttt',
            sessionData = { id : '123'};
          return callback(token, sessionData);
        };

        let getSessionFromRequestStub = sinon.stub(security, 'getSessionFromRequest');
        getSessionFromRequestStub.callsFake(getSessionFromRequestFn);
      });
      after( () => {
        security.getSessionFromRequest.restore();
      });
      it('pass login="roberto" password="carlos" request.headers.cookie="SESSID=ddddffff2222tttt", response={}, expect correct token and sessionData', (done) => {
        const login = 'roberto',
          password = 'carlos',
          request = {
            headers : {
              cookie : 'SESSID=ddddffff2222tttt'
            }
          },
          response = {},
          resultToken = 'ddddffff2222tttt',
          ownerID = '123';
        security.loginUsingCookies(login, password, request, response, (token, sessionData) => {
          expect(token).to.equal(resultToken);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(ownerID);
          done();
        });
      });
    });

    describe('check: getSessionFromRequest() return not exist token and error occurred in loginUsingToken()', () => {
      before( () => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = null,
            sessionData = null;
          return callback(token, sessionData);
        }
        let getSessionFromRequestStub = sinon.stub(security, 'getSessionFromRequest');
        getSessionFromRequestStub.callsFake(getSessionFromRequestFn);

        const loginUsingTokenFn = (login, password, callback) => {
          const error = new Error('Find error in Mongo!'),
            generatedToken = null,
            createdSessionData = null;
          return callback(error, generatedToken, createdSessionData);
        }
        let loginUsingTokenStub = sinon.stub(security, 'loginUsingToken');
        loginUsingTokenStub.callsFake(loginUsingTokenFn);

      });
      after( () => {
        security.getSessionFromRequest.restore();
        security.loginUsingToken.restore();
        router.bleed.restore();
      });
      it('pass login="oliver", password="kan" expect router.bleed calls once', () => {
        const login = 'oliver',
          password = 'kan',
          request = {
            headers : {
              cookie: ''
            }
          },
          response = {};
        let routerMock = sinon.mock(router);
        routerMock.expects('bleed').once().withArgs(500, null, response, sinon.match.any);
        security.loginUsingCookies(login, password, request, response, (token, sessionData) => {
          routerMock.verify();
        });
      });
    });

    describe('check: getSessionFromRequest() return token=null, loginUsingToken() generate token and create sessionData', () => {
      let routerMock = sinon.mock(router);
      before( () => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = null,
            sessionData = null;
          return callback(token, sessionData);
        }
        let getSessionFromRequestStub = sinon.stub(security, 'getSessionFromRequest');
        getSessionFromRequestStub.callsFake(getSessionFromRequestFn);

        const loginUsingTokenFn = (login, password, callback) => {
          const error = null,
            token = 'ddddffff2222tttt',
            sessionData = { id : '123' };
          return callback(error, token, sessionData);
        }
        let loginUsingTokenStub = sinon.stub(security, 'loginUsingToken');
        loginUsingTokenStub.callsFake(loginUsingTokenFn);

      });

      after( () => {
        security.getSessionFromRequest.restore();
        security.loginUsingToken.restore();
        routerMock.restore();
      });

      it('pass login="david", password="beckham", expect correct token and sessionData, response.setHeader calls once, router.bleed never calls', (done) => {
        const login = 'david',
          password = 'beckham',
          request = {
            headers : {
              cookie : ''
            }
          },
          response = {
            setHeader() {
              console.log('setHeader called!');
            }
          },
          resultToken = 'ddddffff2222tttt',
          resultID = '123';
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').once().withArgs('Set-Cookie', sinon.match.any);

        routerMock.expects('bleed').never();

        security.loginUsingCookies(login, password, request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          responseMock.restore();
          expect(sessionToken).to.equal(resultToken);
          expect(sessionData).have.property('id');
          expect(sessionData.id).to.equal(resultID);
          done();
        });
      });
    });

    describe('check: getSessionFromRequest() return token=null, loginUsingToken() return token=null', () => {
      let routerMock = sinon.mock(router);
      before( () => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = null,
            sessionData = null;
          return callback(token, sessionData);
        }
        let getSessionFromRequestStub = sinon.stub(security, 'getSessionFromRequest');
        getSessionFromRequestStub.callsFake(getSessionFromRequestFn);

        const loginUsingTokenFn = (login, password, callback) => {
          const error = null,
            token = null,
            sessionData = null;
          return callback(error, token, sessionData);
        }
        let loginUsingTokenStub = sinon.stub(security, 'loginUsingToken');
        loginUsingTokenStub.callsFake(loginUsingTokenFn);

      });

      after( () => {
        security.getSessionFromRequest.restore();
        security.loginUsingToken.restore();
        routerMock.restore();
      });

      it('pass login="john", password="terry", expect token=null, sessionData=null, response.setHeader and router.bleed never calls', (done) => {
        const login = 'john',
          password = 'terry',
          request = {
            headers : {
              cookie : ''
            }
          },
          response = {
            setHeader() {
              console.log('setHeader called!');
            }
          };
        let responseMock = sinon.mock(response);
        responseMock.expects('setHeader').never();

        routerMock.expects('bleed').never();

        security.loginUsingCookies(login, password, request, response, (sessionToken, sessionData) => {
          routerMock.verify();
          responseMock.verify();
          responseMock.restore();
          expect(sessionToken).to.be.null;
          expect(sessionData).to.be.null;
          done();
        });
      });
    });
  });

//TODO: logoutUsingToken and logoutUsingCookies
//logoutUsingToken
  describe('\nfunc logoutUsingToken()\n', () => {
    describe('check: succecful deleting session from DB', () => {
      before( () => {
        const stubDbCollection = {
          collection : () => {
            return {
              deleteOne : (searchArgs) => {
                return true;
              }
            }
          }
        }
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('pass sessionKey="ddddffff2222tttt" expect no errors in callback', (done) => {
        const sessionKey='ddddffff2222tttt';
        security.logoutUsingToken(sessionKey, (error) => {
          expect(error).to.be.null;
          done();
        });
      });
    })

    describe('check: error in deleting session from DB', () => {
      before( () => {
        const stubDbCollection = {
          collection : () => {
            return {
              deleteOne : () => {
                const error = new Error('Delete error in Mongo!');
                throw error;
              }
            }
          }
        }
        let getDBStub = sinon.stub(dbConnect, 'getDB');
        getDBStub.returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
      it('pass sessionKey="wrongSessionKey" expect delete error', (done) => {
        const sessionKey = 'wrongSessionKey',
          errorMsg = 'Delete error in Mongo!';
        security.logoutUsingToken(sessionKey, (error) => {
          expect(error).to.be.an('error');
          expect(error.message).to.equal(errorMsg);
          done();
        });
      });
    });
  });

//logoutUsingCookies
  describe('\nfunc logoutUsingCookies()\n', () => {
    let sandbox = sinon.createSandbox();
    afterEach( () => {
      sandbox.restore();
    });
    describe('check: token not found from func getSessionFromRequest() ', () => {
      before(() => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = null;
          return callback(token);
        }
        sandbox.stub(security, 'getSessionFromRequest').callsFake(getSessionFromRequestFn);
      });
      it('pass empty cookie in request expect empty callback', (done) => {
        const request = {
          headers : {
            cookie : ''
          }
        },
        response = {};
        security.logoutUsingCookies(request, response, done);
      });
    });

    describe('check: token founded in getSessionFromRequest(), but error in logoutUsingToken()', () => {
      before(() => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = 'wrongSessionToken';
          return callback(token);
        }
        sandbox.stub(security, 'getSessionFromRequest').callsFake(getSessionFromRequestFn);

        const logoutUsingTokenFn = (sessionToken, callback) => {
          const error = new Error('Delete error in Mongo!');
          return callback(error);
        }
        sandbox.stub(security, 'logoutUsingToken').callsFake(logoutUsingTokenFn);
      });

      it('pass request with bad SESSID in cookie expect calls router.bleed', () => {
          const request = {
          headers : {
            cookie : 'SESSID=wrongSessionToken'
          }
        },
        response = {};
        sandbox.mock(router).expects('bleed').once().withArgs(500, null, response, sinon.match.any);

        security.logoutUsingCookies(request, response, () => {
          sandbox.verify();
        });
      });
    });

    describe('check: token founded in getSessionFromRequest() and no errors in loginUsingToken()', () => {
      before( () => {
        const getSessionFromRequestFn = (request, response, callback) => {
          const token = 'ddddffff2222tttt';
          return callback(token);
        };
        sandbox.stub(security, 'getSessionFromRequest').callsFake(getSessionFromRequestFn);

        const logoutUsingTokenFn = (sessionToken, callback) => {
          const error = null;
          return callback(error);
        };
        sandbox.stub(security, 'logoutUsingToken').callsFake(logoutUsingTokenFn);
      });
      it('pass correct cookie in request expect response.setHeader calls, router.bleed no calls', (done) => {
        const request = {
          headers : {
            cookie : 'SESSID=ddddffff2222tttt'
          }
        },
        response = {
          setHeader(){
            console.log('Called func setHeader!');
          }
        };
        sandbox.mock(router).expects('bleed').never();
        sandbox.mock(response).expects('setHeader').once().withArgs('Set-Cookie', sinon.match.any);

        security.logoutUsingCookies(request, response, () => {
          sandbox.verify();
          done();
        })
      });
    });
  });

//TODO: updateSessionFromCookies, updateSessionFromRequest, updateSession

//checkUserPasswordReset
  describe('\nfunc checkUserPasswordReset()\n', () => {
    describe('check passing uncorrect sessionData object', () => {
      it('pass sessionData=null => expect false', (done) => {
        const sessionData = null;
        security.checkUserPasswordReset(sessionData, (err, reseted) => {
          if(err) done(err);
          expect(reseted).to.be.false;
          done();
        });
      });
      it('pass sessionData={} => expect false', (done) => {
        const sessionData = {};
        security.checkUserPasswordReset(sessionData, (err, reseted) => {
          if(err) done(err);
          expect(reseted).to.be.false;
          done();
        });
      });
      it('pass sessionData=undefined => expect false', (done) => {
        const sessionData = undefined;
        security.checkUserPasswordReset(sessionData, (err, reseted) => {
          if(err) done(err);
          expect(reseted).to.be.false;
          done();
        });
      });
    });
    describe('check path with ID, when passwordReset=false', () => {
      before( () => {
        let stubDbCollection = {
          collection: () => {
            return {
              findOne: (obj1, obj2, callback) => {
                const result = { passwordReset : false };
                return callback(null, result);
              }
            }
          }
        };
        const dbConnectStub = sinon.stub(dbConnect, 'getDB').returns(stubDbCollection);
      });
      after( () => {
        dbConnect.getDB.restore();
      });
        it('pass admin sessionData.id=5e6f4f587c1479069d229ac6 => expect false', (done) => {
          const sessionData = { id : '5e6f4f587c1479069d229ac6' };
          security.checkUserPasswordReset(sessionData, (err, reseted) => {
            if(err) done(err);
            expect(reseted).to.be.false;
            done();
          });
        });
      });
      describe('check path with non-existent ID', () => {
        before( () => {
          let stubDbCollection = {
            collection: () => {
              return {
                findOne: (obj1, obj2, callback) => {
                  return callback(null, null);
                }
              }
            }
          };
          const dbConnectStub = sinon.stub(dbConnect, 'getDB').returns(stubDbCollection);
        });
        after( () => {
          dbConnect.getDB.restore();
        });
        it('pass non-existent sessionData.id=5f0359771d1b3f0fdcc1cd0c => expect false', (done) => {
          const sessionData = { id : '5f0359771d1b3f0fdcc1cd0c' };
          security.checkUserPasswordReset(sessionData, (err, reseted) => {
            if(err) done(err);
            expect(reseted).to.be.false;
            done();
          });
        });
      });
      describe('check path with errors from Mongo', () => {
        before( () => {
          let stubDbCollection = {
            collection: () => {
              return {
                findOne: (obj1, obj2, callback) => {
                  const error = new Error('Uncorrect data for ObjectID!');
                  return callback(error, null);
                }
              }
            }
          };
          const dbConnectStub = sinon.stub(dbConnect, 'getDB').returns(stubDbCollection);
        });
        after( () => {
          dbConnect.getDB.restore();
        });
        it('pass bad sessionData.id=1235431 => expect type error', (done) => {
          const sessionData = { id : '1235431' };
          security.checkUserPasswordReset(sessionData, (err, reseted) => {
            const resultError = new Error('Uncorrect data for ObjectID!');
            if(err) {
              expect(err).to.be.an('error');
              expect(err.message).to.equal('Uncorrect data for ObjectID!');
              done();
            } else {
              done(err)
            }
          });
        });
      });
  });
});
