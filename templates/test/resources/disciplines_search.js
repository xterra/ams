let searchDisciplines = function(){
  let input = document.getElementById("search");
  input.addEventListener('input', function(){
    let splitPhrases = input.value.toLowerCase().split(' '),
        searchElements = document.querySelectorAll('.col-sm-6');

    searchElements.forEach(item => {
      let resultSearch = splitPhrases.reduce((total, currentPhrase) => {
        if(item.textContent.toLowerCase().replace(/\n|\r|\t/gi, "").indexOf(currentPhrase) > -1){
          return total = (total && 1);
        } else {
          return total = 0;
        }
      }, 1);
      if(resultSearch){
        item.style.display = '';
      }else{
        item.style.display = 'none';
      }
    });
  });
};

searchDisciplines();
