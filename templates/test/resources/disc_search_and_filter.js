let searchAndFilter = function() {
  let filterForm = document.getElementById("filter"),
      inputForm = document.getElementById("search"),
      disciplines = document.querySelectorAll('.col-sm-6');

  filterForm.addEventListener("change", searchAndFilterHandler);
  inputForm.addEventListener("input", searchAndFilterHandler);

  function searchAndFilterHandler(){
    let typesForFilter = getValuesFromCheckboxes('types'),
        groupsForFilter = getValuesFromCheckboxes('groups'),
        coursesForFilter = getValuesFromCheckboxes('courses');

    let splitSearchPhrases = inputForm.value.toLowerCase().split(' ');

    disciplines.forEach(currentDisc => {
      if(typesForFilter.length == 0 && groupsForFilter.length == 0 && coursesForFilter.length == 0 && splitSearchPhrases.length == 0){
        currentDisc.style.display = '';
      } else {
        let typeFilterResult = checkCoincidence(typesForFilter);
        let groupFilterResult = checkCoincidence(groupsForFilter);
        let courseFilterResult = checkCoincidence(coursesForFilter);
        let searchResult = splitSearchPhrases.length == 0 ? true : splitSearchPhrases.reduce((total, currentPhrase) => {
          if(currentDisc.textContent.toLowerCase().indexOf(currentPhrase) > -1){
            return total = (total && 1);
          } else {
            return total = 0;
          }
        }, 1);

        if(typeFilterResult && groupFilterResult && courseFilterResult && searchResult){
          currentDisc.style.display = '';
        }else{
          currentDisc.style.display = 'none';
        }
      }
      function checkCoincidence(phrasesThatCheck){
        return phrasesThatCheck.length == 0 ? true : phrasesThatCheck.reduce((total, currentPhrase) => {
          if(currentDisc.textContent.toLowerCase().indexOf(currentPhrase) > -1){
            return total = (total || 1);
          } else {
            return total = (total || 0);
          }
        }, 0);
      }
    });
  }
  function getValuesFromCheckboxes(nameCheckbox){
    let selectedCheckboxes = document.querySelectorAll(`input[name=${nameCheckbox}]:checked`);
    return [].map.call(selectedCheckboxes, (currentCheckbox) => {return currentCheckbox.value.toLowerCase()});
  }
}
searchAndFilter();

let deleteSearchText = function clearSearchText() {
  let cleanerText = document.getElementById('cleanerText');
  cleanerText.addEventListener('click', function(){
    searchInput = document.getElementById("search");
    searchInput.value = '';
    let event = new Event("input");
    searchInput.dispatchEvent(event);
  });
}
deleteSearchText();
