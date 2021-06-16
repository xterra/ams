module.exports = {
  isUserAuthed,
  isUserAdminOrTeacher,
  isTeacherDiscEditor,
  isUserTeacher,
  isUserStudentWithGroup
}

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}

function isUserAdminOrTeacher(userInfo) {
  const userRoles = userInfo.securityRole;
  if (userRoles.length !== 0) {
    return ( userRoles.includes('superadmin') ||
      userRoles.includes('admin') ||
      userRoles.includes('teacher') );
  }
  return false;
}

function isTeacherDiscEditor(userInfo, discipline) {
  if (userInfo.securityRole == 'teacher') {
    return discipline.editors.includes(userInfo._id.toString());
  }
  return true;
}

function isUserTeacher(userInfo) {
  const roles = userInfo.securityRole;

  if (roles.length > 0) return roles.includes('teacher');
  return false;
}

function isUserStudentWithGroup(userInfo) {
  const roles = userInfo.securityRole;

  if (roles.length > 0 &&
      userInfo.group !== undefined) return roles.includes('student');
  return false;
}
