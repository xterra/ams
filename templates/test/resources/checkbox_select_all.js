document.addEventListener('change', () => {
  const chk = event.target;

  if(chk.tagName == 'INPUT'){
    if(chk.name == 'files'){
      let fileCheckboxes = document.querySelectorAll(`input[name=files]`);
      let countSelected = 0;
      let allSelected = true;
      for (let elem of fileCheckboxes) {
        if(elem.checked) countSelected++;
        allSelected =  allSelected && elem.checked;
        if(countSelected > 1 && !allSelected) break;
      }
      showOrHideSubmit(countSelected);
      changeAllFilesCheckbox(allSelected);
    }
    if(chk.name == 'allFiles'){
      selectAllCheckboxes('files');
    }
  }
})

function showOrHideSubmit(countSelected){
  let submitBtn = document.getElementById('submit');
  if(countSelected <= 1) return submitBtn.disabled = true;
  submitBtn.disabled = false;
}

function changeAllFilesCheckbox(allSelected){
  let allFilesCheckbox = document.getElementById('allFiles');
  allFilesCheckbox.checked = allSelected;
}

function selectAllCheckboxes(checkboxName){
  let allFilesCheckbox = document.getElementById('allFiles');
  let checkboxList = document.querySelectorAll(`input[name=${checkboxName}]`);
  console.log(checkboxList);
  for (let element of checkboxList) {
    element.checked = allFilesCheckbox.checked;
  }
  if(allFilesCheckbox.checked) {
    showOrHideSubmit(2);
  } else {
    showOrHideSubmit(0);
  }
}
