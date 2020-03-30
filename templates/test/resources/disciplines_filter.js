let filterDisc = function() {
  let filterForm = document.getElementById("filter");
  filterForm.addEventListener("change", function(){
    let selectedTypes = document.querySelectorAll('input[name="types[]"]:checked');
    let selectedGroups = document.querySelectorAll('input[name="groups[]"]:checked');
    let selectedCourses = document.querySelectorAll('input[name="courses[]"]:checked');
    let filterElements = document.querySelectorAll('.col-sm-6');

    let types = [].map.call(selectedTypes, (currentType) => {return currentType.value.toLowerCase()});
    let groups = [].map.call(selectedGroups, (currentGroup) => {return currentGroup.value.toLowerCase()});
    let courses = [].map.call(selectedCourses, (currentCourse) => {return currentCourse.value.toLowerCase()});

    filterElements.forEach(item => {
      if(types.length == 0 && groups.length == 0 && courses.length == 0){
        item.style.display = '';
      } else {
        let typeFilterResult = types.length == 0 ? true : types.reduce((total, currentType) => {
          if(item.textContent.toLowerCase().indexOf(currentType) > -1){
            return total = (total || 1);
          } else {
            return total = (total || 0);
          }
        }, 0);

        let groupFilterResult = groups.length == 0 ? true : groups.reduce((total, currentGroup) => {
          if(item.textContent.toLowerCase().indexOf(currentGroup) > -1){
            return total = (total || 1);
          } else {
            return total = (total || 0);
          }
        }, 0);

        let courseFilterResult = courses.length == 0 ? true : courses.reduce((total, currentCourse) => {
          if(item.textContent.toLowerCase().indexOf(currentCourse) > -1){
            return total = (total || 1);
          } else {
            return total = (total || 0);
          }
        }, 0)

        if(typeFilterResult && groupFilterResult && courseFilterResult){
          item.style.display = '';
        }else{
          item.style.display = 'none';
        }
      }
    });
  });
}

filterDisc();
