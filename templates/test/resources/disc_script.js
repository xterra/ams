function selectedGroup(){
  let group = document.getElementById('group');
  let valueGroup = group.options[group.selectedIndex].value;
  let course = document.getElementById('course');
  if  (valueGroup == "УВВ"){
    course.options.length = 0;
    for(let i = 1; i < 3; i++){
      course.options[i-1] = new Option(i, i);
    }
  }
  else {
    course.options.length = 0;
    for(let i = 1; i < 5; i++){
      course.options[i-1] = new Option(i, i);
    }
  }
}
