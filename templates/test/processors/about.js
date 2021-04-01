const isUserAuthed = require('./common/permission_check.js').isUserAuthed;

module.exports = {
  path: new RegExp('^/about/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'О нас',
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'about', 0, 5);
    });
  }
};
