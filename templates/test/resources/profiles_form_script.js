function selectedRole(){
  let securityRole = document.getElementById('securityRole');
  let securityRoleValue = securityRole.options[securityRole.selectedIndex].value;
  let position = document.getElementById('position');
  let group = document.getElementById('group');
  if(securityRoleValue == "teacher"){
    position.removeAttribute("hidden");
    group.setAttribute("hidden", "true");
  }
  else {
    position.setAttribute("hidden", "true");
    group.removeAttribute("hidden");
  }
}
let securityRole = document.getElementById('securityRole');
let securityRoleValue = securityRole.options[securityRole.selectedIndex].value;
let position = document.getElementById('position');
let group = document.getElementById('group');
if(securityRoleValue == "teacher"){
  position.removeAttribute("hidden");
  group.setAttribute("hidden", "true");
}
else {
  position.setAttribute("hidden", "true");
  group.removeAttribute("hidden");
}
