function showOrHideButton(checkboxName){
  let submitBtn = document.getElementById('submit');
  let checkedValues = document.querySelectorAll(`input[name=${checkboxName}]:checked`);
  console.log(checkedValues);
  if(checkedValues.length <= 1){
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
  }
}
