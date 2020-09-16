'use strict';
module.exports = function(date) {
  const months = {
    0: 'Января',
    1: 'Февраля',
    2: 'Марта',
    3: 'Апреля',
    4: 'Мая',
    5: 'Июня',
    6: 'Июля',
    7: 'Августа',
    8: 'Сентября',
    9: 'Октября',
    10: 'Ноября',
    11: 'Декабря'
  };
  const passedDate = new Date(date),
    todaysDate = new Date();
  if(passedDate == 'Invalid Date') return '';

  const passedDateStr = `${passedDate.getDate()} ${months[passedDate.getMonth()]} ${passedDate.getFullYear()}`;
  const todaysDateStr = `${todaysDate.getDate()} ${months[todaysDate.getMonth()]} ${todaysDate.getFullYear()}`;
  if (passedDateStr === todaysDateStr) return 'сегодня';
  const previousDate = new Date(todaysDate.setDate(todaysDate.getDate() - 1));
  const previousDateStr = `${previousDate.getDate()} ${months[previousDate.getMonth()]} ${previousDate.getFullYear()}`;
  if (passedDateStr === previousDateStr) return 'вчера';
  return passedDateStr;
};
