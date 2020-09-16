function selectAllCheckboxes(checkboxName){
  let allFilesCheckbox = document.getElementById('allFiles');
  let checkboxList = document.querySelectorAll(`input[name=${checkboxName}]`);
  console.log(checkboxList);
  for (let element of checkboxList) {
    element.checked = allFilesCheckbox.checked;
  }
}
