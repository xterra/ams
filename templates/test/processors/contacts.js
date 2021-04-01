const isUserAuthed = require('./common/permission_check.js').isUserAuthed;

module.exports = {
  path: new RegExp('^/contacts/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'Контакты',
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'contacts', 0, 5);
    });
  }
};
