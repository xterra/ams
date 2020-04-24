function SelectShow(elementID)
  {

    let len= document.getElementById(elementID).options.length;
    let selectedElements = [];
    let i =0;

    for (let n = 0; n < len; n++)
    {
      if (document.getElementById(elementID).options[n].selected==true)
      {

       selectedElements[i]=document.getElementById(elementID).options[n].text;

             i++;
      }

    }
		let divSelected = document.getElementById("selected"+elementID);
       divSelected.innerHTML = "Выбранные значения: \n" + selectedElements.join('; ');
  }
