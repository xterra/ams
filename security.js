'use strict';

const fs = require('fs'),
  ini = require('ini'),
  path = require('path'),
  cookie = require('cookie'),
  randomstring = require('randomstring'),
  md5 = require('md5');

const router = require('./router'),
  dbConnect = require('./dbConnect');

let sessionCookieName = 'SESSID',
  loginCaseSensitive = true,
  passwordCaseSensitive = true,
  randomstringLength = 64,
  randomstringType = 'alphanumeric', // alphanumeric, numeric, alphabetic, hex
  sessionLifetime = 4 * 24 * 60 * 60,
  sessionTokenInMemoryLifetime = 43200,
  sessionTokenInMemoryMaxSize = 10000,
  sessionCleanerInterval = 60,
  tmpFileCleanerInterval = 7200,
  context = {};

function generateToken(callback) {
  if (dbConnect.isConnected()) {
    let generationInProcess = false;
    const generatorInterval = setInterval(() => {
      if (generationInProcess) return;
      generationInProcess = true;
      const token = generateTokenInMemory();
      dbConnect.getDB().collection('sessions').findOne({
        _id: token
      }, { _id: 1 }, (error, found) => {
        if (error) {
          clearInterval(generatorInterval);
          return callback(error, null);
        }
        if (found == null) {
          clearInterval(generatorInterval);
          return callback(null, token);
        } else {
          generationInProcess = false;
          console.warn(`Generated token for user is already in DB.
            Is that ok? May be you should check configs?`);
        }
      });
    }, 0);
  } else {
    return callback(null, generateTokenInMemory());
  }
}

function generateTokenInMemory() {
  let token = null;
  while (token == null || typeof context[token] !== 'undefined') {
    token = randomstring.generate({
      length: randomstringLength,
      charset: randomstringType
    });
  }
  return token;
}

function loginUsingCookies(login, password, request, response, callback) {
  return module.exports.getSessionFromRequest(request, response, (sessionToken, sessionData) => {
    if (sessionToken == null || sessionData == null) {
      console.log('User is not logged in, logging in...');
      return module.exports.loginUsingToken(login, password, (error, generatedSessionToken, createdSessionData) => {
        if (error) {
          console.error('An error occurred, while logging in using cookies:', error);
          return router.bleed(500, null, response, error);
        }
        if (generatedSessionToken) {
          // user can fail login - that is why there is condition
          response.setHeader('Set-Cookie',
            cookie.serialize(sessionCookieName, generatedSessionToken, {
              expires: new Date((new Date()).getTime() + sessionLifetime * 1000),
              path: '/'
            })
          );
        }
        return callback(generatedSessionToken, createdSessionData);
      });
    } else {
      // there is no need to make cookie update, because it will be in getSessionFromRequest
      console.log('User already logged in');
      return callback(sessionToken, sessionData);
    }
  }, true);
}

function loginUsingToken(login, password, callback) {
  if (!loginCaseSensitive) {
    login = login.toLowerCase();
  }
  if (!passwordCaseSensitive) {
    password = password.toLowerCase();
  }
  password = md5(password); // TODO: SHA-256
  if (dbConnect.isConnected()) {
    dbConnect.getDB().collection('users').findOne({
      username: login,
      password
    }, { _id: 1 }, (error, found) => {
      if (error) {
        return callback(error, false, null);
      }
      if (found) {
        console.log(`Authing user ${found._id} ...`);
        return module.exports.makeSession(found._id, (error, token, sessionData) => {
          if (error) return callback(error, false, null);
          console.info(`User ${found._id} authed!`);
          sessionData['id'] = found._id;
          callback(null, token, sessionData);
        });
      } else {
        callback(null, false, null);
      }
    });
  } else if (login === 'admin' && password === '5f4dcc3b5aa765d61d8327deb882cf99') {
    return module.exports.makeSession('5f4dcc3b5aa765d61d8327deb882cf99', (error, token, sessionData) => {
      if (error) return callback(error, false, null);
      callback(null, token, sessionData);
    });
  } else {
    callback(null, false, null);
  }
}

function makeSession(userID, callback) {
  return generateToken((error, token) => {
    if (error) return callback(error, false, null, null);
    module.exports.makeSessionUsingToken(token, userID, callback);
  });
}

function makeSessionUsingToken(token, userID, callback) {
  const defaultSessionData = { id: userID };
  if (dbConnect.isConnected()) {
    return storeSessionInDB(token, defaultSessionData, userID, (error, storedSessionData) => {
      console.error(error);
      if (error) {
        return callback(error, false, null, null);
      }
      const sessionData = storeSessionInMemory(token, storedSessionData, userID);
      return callback(null, token, sessionData, userID);
    });
  } else {
    console.warn('New session stored at in-memory cache');
    const sessionData = storeSessionInMemory(token, defaultSessionData, userID);
    return callback(null, token, sessionData, userID);
  }
}

function storeSessionInDB(token, sessionData, userID, callback) {
  return dbConnect.getDB().collection('sessions').insertOne({
    _id: token,
    data: sessionData,
    freshness: new Date((new Date()).getTime() + sessionLifetime * 1000),
    ownerID: userID
  }, null, (error, result) => {
    if (error) {
      return callback(error, null, null);
    }
    callback(null, result.ops[0].data, result.ops[0].ownerID);
  });
}

function storeSessionInMemory(token, sessionData, userID) {
  context[token] = [new Date(), sessionData, userID];
  return context[token][1];
}

function logoutUsingCookies(request, response, callback) {
  return module.exports.getSessionFromRequest(request, response, sessionToken => {
    if (sessionToken == null) {
      console.log('User is not logged in');
      return callback();
    } else {
      return module.exports.logoutUsingToken(sessionToken, error => {
        if (error) {
          console.error('An error occurred, while logging in using cookies:', error);
          return router.bleed(500, null, response, error);
        }
        response.setHeader('Set-Cookie',
          cookie.serialize(sessionCookieName, '', {
            expires: new Date(0),
            path: '/'
          })
        );
        return callback();
      });
    }
  }, true);
}

function logoutUsingToken(sessionKey, callback) {
  delete context[sessionKey];
  // TODO: delete from DB
  try {
    dbConnect.getDB().collection('sessions').deleteOne({ _id: sessionKey });
  } catch (err) {
    console.log(`Error with deleting session token from ${err}`);
    callback(err);
  }
  callback(null);
}

function getSessionFromRequest(request, response, callback, restrictHeadersChange) {
  if (typeof request.headers.cookie === 'undefined') {
    return callback(null, null);
  }
  if (typeof restrictHeadersChange !== 'boolean') restrictHeadersChange = false;

  const rawCookies = request.headers.cookie;
  return module.exports.getSessionFromCookies(rawCookies, (error, sessionToken, sessionData) => {
    if (error) {
      console.error('An error occurred, while getting session from request:', error);
      return router.bleed(500, null, response, error);
    }
    if (sessionToken !== null && sessionData !== null) {
      if (!restrictHeadersChange) {
        response.setHeader('Set-Cookie',
          cookie.serialize(sessionCookieName, sessionToken, {
            expires: new Date((new Date()).getTime() + sessionLifetime * 1000),
            path: '/'
          })
        );
      }
    }
    return callback(sessionToken, sessionData);
  });
}


function getSessionFromCookies(rawCookies, callback) {
  try {
    const cookies = cookie.parse(rawCookies);
    if (typeof cookies[sessionCookieName] !== 'string') {
      console.log('User do not have session token in cookies');
      return callback(null, null);
    } else {
      const sessionToken = cookies[sessionCookieName];
      console.log('User have session token:', sessionToken);
      return getSessionData(sessionToken, (error, sessionData) => {
        callback(error, sessionData !== null ? sessionToken : false, sessionData);
      });
    }
  } catch(err){
    console.log(`Error in getSessionFromCookies: ${err}`);
    return callback(err);
  }
}

function getSessionData(sessionToken, callback) {
  if (typeof context[sessionToken] !== 'undefined') {
    // TODO: update session lifetime in DB
    console.log(`\ngetSessionData: ${JSON.stringify(context[sessionToken])}\n`);
    context[sessionToken][0] = new Date();
    callback(null, context[sessionToken][1]);
  } else {
    dbConnect.getDB().collection('sessions').findOne({
      _id: sessionToken
    }, (err, result) => {
      if (err) return callback(err, null);
      if (result == null) return callback(null, null);

      console.log(`\nGet info about session: ${JSON.stringify(result)}\n`);
      const sessionData = result.data;
      sessionData['id'] = result.ownerID;
      context[sessionToken] = [new Date(), sessionData, result.ownerID];
      return callback(null, sessionData);
    });
    // TODO: update session lifetime in cache and DB
    // TODO: add go to DB to load and update
  }
}

function updateSessionFromRequest(request, response, sessionData, callback) {
  if (typeof request.headers.cookie === 'undefined') {
    return callback(null, false);
  }

  const rawCookies = request.headers.cookie;
  return updateSessionFromCookies(rawCookies, sessionData, (error, updated) => {
    if (error) {
      console.error('An error occurred, while logging in using cookies:', error);
      return router.bleed(500, null, response, error);
    }
    return callback(updated);
  });
}

function updateSessionFromCookies(rawCookies, sessionData, callback) {
  const cookies = cookie.parse(rawCookies);
  if (typeof cookies[sessionCookieName] !== 'string') {
    console.log('User do not have session token in cookies');
    return callback(null, false);
  } else {
    const sessionToken = cookies[sessionCookieName];
    console.log('User have session token:', sessionToken);
    return updateSession(sessionToken, sessionData, callback);
  }
}

function updateSession(sessionToken, sessionData, callback) {
  if (typeof context[sessionToken] !== 'undefined') {
    // TODO: update session in DB
    context[sessionToken][1] = sessionData;
    callback(null, true);
  } else {
    console.warn('User do not have stored data in context. Is that okay, damn?', sessionToken);
    callback(null, false);
  }
}

function checkUserPasswordReset(sessionData, callback) {
  if (sessionData == null || sessionData['id'] == undefined) {
    return callback(null, false);
  }
  const userID = sessionData.id;
  dbConnect.getDB().collection('users').findOne({
    _id: userID
  }, { passwordReset: 1 }, (err, result) => {
    if (err) {
      console.log(`Error occurred in checkUserPasswordReset when search user: ${err}`);
      return callback(err, null);
    }
    if (result == null) {
      return callback(null, false);
    } else {
      return callback(null, result.passwordReset);
    }
  });
}

function reloadConfigurations() {
  const securityConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, 'configurations', 'security.ini'), 'utf-8'));

  if (typeof securityConfigurations['client']['sessionCookieName'] === 'string')
    sessionCookieName = securityConfigurations['client']['sessionCookieName'];
  console.log('Configs, session cookie name:\t', sessionCookieName);

  if (typeof securityConfigurations['authorization']['loginCaseSensitive'] === 'boolean')
    loginCaseSensitive = securityConfigurations['authorization']['loginCaseSensitive'];
  console.log('Configs, login case sensitive:\t', loginCaseSensitive);

  if (typeof securityConfigurations['authorization']['passwordCaseSensitive'] === 'boolean')
    passwordCaseSensitive = securityConfigurations['authorization']['passwordCaseSensitive'];
  console.log('Configs, pass case sensitive:\t', passwordCaseSensitive);

  if (typeof securityConfigurations['authorization']['tokenLength'] === 'string')
    randomstringLength = parseInt(securityConfigurations['authorization']['tokenLength']);
  console.log('Configs, secret token length:\t', randomstringLength);

  if (typeof securityConfigurations['authorization']['tokenGeneratorMode'] === 'string')
    randomstringType = securityConfigurations['authorization']['tokenGeneratorMode'];
  console.log('Configs, token generator mode:\t:', randomstringType);

  if (typeof securityConfigurations['client']['sessionCookieLifetime'] === 'string')
    sessionLifetime = parseInt(securityConfigurations['client']['sessionCookieLifetime']);
  console.log('Configs, session lifetime:\t\t', sessionLifetime);

  if (typeof securityConfigurations['server']['sessionTokenInMemoryLifetime'] === 'string')
    sessionTokenInMemoryLifetime = parseInt(securityConfigurations['server']['sessionTokenInMemoryLifetime']);
  console.log('Configs, session token in RAM:\t', sessionTokenInMemoryLifetime);

  if (typeof securityConfigurations['server']['sessionTokenInMemoryMaxSize'] === 'string')
    sessionTokenInMemoryMaxSize = parseInt(securityConfigurations['server']['sessionTokenInMemoryMaxSize']);
  console.log('Configs, sessions amount in RAM:', sessionTokenInMemoryMaxSize);

  if (typeof securityConfigurations['server']['sessionCleanerInterval'] === 'string')
    sessionCleanerInterval = parseInt(securityConfigurations['server']['sessionCleanerInterval']);
  console.log('Configs, session cleaning secs:\t', sessionCleanerInterval);

  if (typeof securityConfigurations['server']['tmpFileCleanerInterval'] === 'string')
    tmpFileCleanerInterval = parseInt(securityConfigurations['server']['tmpFileCleanerInterval']);
  console.log('Configs, temporary files cleaning secs:\t', tmpFileCleanerInterval);
}

function resetContext() {
  context = {};
  console.log('Context reset done');
}

let sessionCleanerTicker = null;

function runSessionCleaner() {
  if (sessionCleanerTicker === null) {
    sessionCleanerTicker = setInterval(() => {
      console.log('Cleaning security context...');
      // TODO: clear context!
      const currentTime = new Date();
      dbConnect.getDB().collection('sessions').remove({
        freshness: { $lte: currentTime }
      }, (err, result) => {
        if (err) console.log(err);
        console.log(`Sessions deleted:\n ${JSON.stringify(result)}`);
      });
    }, sessionCleanerInterval * 1000);
  }
}

function stopSessionCleaner() {
  if (sessionCleanerTicker !== null) {
    clearInterval(sessionCleanerTicker);
    sessionCleanerTicker = null;
  }
}

let tmpFileCleanerTicker = null;

function runTmpFileCleaner() {
  if (tmpFileCleanerTicker === null) {

    tmpFileCleanerTicker = setInterval(() => {

      console.log('Deleting tmp files...');
      const STORAGE_TMP_LOCATION = process.env['STORAGE_TMP_LOCATION'];
      const PATH_TO_TMP = STORAGE_TMP_LOCATION || `${__dirname}/tmp`;
      const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
      const timeForDelete = Date.now() - TWO_HOURS_IN_MS;

      fs.readdir(PATH_TO_TMP, (err, files) => {
        if (err) console.error(err);

        if (Array.isArray(files) && files.length) {

          files.forEach(fileName => {
            let fileFullPath = `${PATH_TO_TMP}/${fileName}`;

            fs.stat(fileFullPath, (err, fileStats) => {
              const modeFileTime = fileStats.mtimeMs;
              if (modeFileTime < timeForDelete) {
                fs.unlink(fileFullPath, err => {
                  if (err) console.log(err);
                  console.log(`File ${fileName} deleted from TMP!\n`)
                });
              }
            });//fs.stat
          }); // files.forEach
        }
      }); //fs.readdir
    }, tmpFileCleanerInterval * 1000)
  }
}

function stopTmpFileCleaner() {
  if (tmpFileCleanerTicker !== null) {
    clearInterval(tmpFileCleanerTicker);
    tmpFileCleanerTicker = null;
  }
}


module.exports = {
  prepare(callback) {
    resetContext();
    reloadConfigurations();
    runSessionCleaner();
    runTmpFileCleaner();
    callback();
  },
  resetContext,
  reloadConfigurations,
  loginUsingCookies,
  loginUsingToken,
  getSessionData,
  getSessionFromCookies,
  getSessionFromRequest,
  makeSessionUsingToken,
  makeSession,
  logoutUsingCookies,
  logoutUsingToken,
  updateSessionFromRequest,
  updateSessionFromCookies,
  updateSession,
  runSessionCleaner,
  stopSessionCleaner,
  runTmpFileCleaner,
  stopTmpFileCleaner,
  checkUserPasswordReset,
};
