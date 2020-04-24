module.exports = function(date){
    const months = {
      0: "Января",
      1: "Февраля",
      2: "Марта",
      3: "Апреля",
      4: "Мая",
      5: "Июня",
      6: "Июля",
      7: "Августа",
      8: "Сентября",
      9: "Октября",
      10: "Ноября",
      11: "Декабря"
    };
    console.log(date);
    let passedDate = new Date(date);
    let todaysDate = new Date();

    let passedDateStr = `${passedDate.getDate()} ${months[passedDate.getMonth()]} ${passedDate.getFullYear()}`;
    let todaysDateStr = `${todaysDate.getDate()} ${months[todaysDate.getMonth()]} ${todaysDate.getFullYear()}`;
    if(passedDateStr == todaysDateStr) return "сегодня";
    let previousDate = new Date (todaysDate.setDate(todaysDate.getDate() - 1));
    let previousDateStr = `${previousDate.getDate()} ${months[previousDate.getMonth()]} ${previousDate.getFullYear()}`;
    if(passedDateStr == previousDateStr) return "вчера";
    return passedDateStr;
  }
