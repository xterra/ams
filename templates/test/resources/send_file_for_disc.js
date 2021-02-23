let fileInput = document.getElementById('myfile');

fileInput.addEventListener('change', () => {
  let file = fileInput.files[0];
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload/", true);
  let printResponseWithXhr = printResponse.bind(xhr, file);
  xhr.onload = printResponseWithXhr;
  xhr.onerror = printError;
  xhr.send(file);
  return false;

  function printResponse(file) {
    let fileID = document.getElementById('fileID');
    let fileSize = document.getElementById('fileSize');
    let fileType = document.getElementById('fileType');
    let fileExt = document.getElementById('fileExt');
    let uploadMessage = document.getElementById('uploadMessage');
    if(file) {
      let delimeteredFileName = file.name.split(".");
      let fileExtension = delimeteredFileName[delimeteredFileName.length -1].toLowerCase();

      fileID.value = this['responseText'];
      fileExt.value = fileExtension;
      fileSize.value = file.size;
      fileType.value = file.type;
      uploadMessage.classList.remove('alert-danger');
      uploadMessage.classList.add('alert');
      uploadMessage.classList.add('alert-primary');
      uploadMessage.innerHTML = 'Файл предварительно загружен';
    } else {
      fileID.value = '';
      fileExt.value = '';
      fileSize.value = '';
      fileType.value = '';
      uploadMessage.classList.remove('alert-primary');
      uploadMessage.innerHTML = '';
    }
  }
  function printError() {
    let uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.classList.remove('alert-primary');
    uploadMessage.classList.add('alert');
    uploadMessage.classList.add('alert-danger');
    uploadMessage.innerHTML = 'Ошибка предварительной загрузки файла';
  }
});
