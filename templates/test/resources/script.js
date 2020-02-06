function selectedFile() {
                let selectedFile = document.getElementById("myfile");
                let file = selectedFile.files[0];
                if (file) {
                  console.log(file);
                    let fileSize = 0;
                    if (file.size > 1048576)
                        fileSize = (Math.round(file.size * 100 / 1048576) / 100).toString() + ' MB';
                    else
                        fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + ' Kb';

                    let divfileSize = document.getElementById('fileSize');
                    let divfileType = document.getElementById('fileType');
                    divfileSize.innerHTML = 'Размер файла: \n' + fileSize;
                    divfileType.innerHTML = 'Тип контента: \n' + file.type;
                    let uploadForm = document.getElementById('upload');
                    uploadForm.enctype = "multipart/form-data";
                } else{
                  let divfileSize = document.getElementById('fileSize');
                  let divfileType = document.getElementById('fileType');
                  divfileSize.innerHTML = '';
                  divfileType.innerHTML = '';
                  let uploadForm = document.getElementById('upload');
                  uploadForm.enctype = "";
                }
}
