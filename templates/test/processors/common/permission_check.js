module.exports = {
  isUserAuthed,
  isUserAdminOrTeacher,
  isTeacherDisciplineEditor
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function isUserAdminOrTeacher(userInfo) {
  const userRoles = userInfo.securityRole;
  if(userRoles.length !== 0){
    return ( userRoles.includes('superadmin') ||
      userRoles.includes('admin') ||
      userRoles.includes('teacher') );
  }
  return false;
}

function isTeacherDisciplineEditor(userInfo, discipline) {
  if( userInfo.securityRole == 'teacher' ) {
    return discipline.editors.includes( userInfo._id.toString() );
  }
  return true;
}
