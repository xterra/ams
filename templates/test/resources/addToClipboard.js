function addToClipboard(id){
  let elementForCopy = document.getElementById(id);
  let tempInput = document.createElement("input");
  tempInput.style = "position: absolute; left: -1000px; top: -1000px";
  tempInput.value = elementForCopy.value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  alert("Copied text:  " + tempInput.value)
  document.body.removeChild(tempInput);
}
