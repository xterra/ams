const expect = require('chai').expect,
  beautyDate = require('../beautyDate.js');

describe('Testing beautyDate.js', () => {
  it('result should be a string', () => {
    const todaysDate = new Date();
    const twoDaysAgo = todaysDate.setDate(todaysDate.getDate() - 2);
    expect(beautyDate(twoDaysAgo)).to.be.a('string');
  });

  it('pass todaysDate => shoud return "сегодня"', () => {
    const todaysDate = new Date();
    expect(beautyDate(todaysDate)).to.equal('сегодня');
  });

  it('pass previousDate => should return "вчера"', () => {
    const todaysDate = new Date();
    const previousDate = todaysDate.setDate(todaysDate.getDate() - 1);
    expect(beautyDate(previousDate)).to.equal('вчера');
  });

  it('pass December 17, 1995 03:24:00 => shoud return "17 Декабря 1995"', () => {
    expect(beautyDate('December 17, 1995 03:24:00')).to.equal('17 Декабря 1995');
  });

  it('pass the bad input => shoud return empty string', () => {
    expect(beautyDate('blabla')).to.equal('');
  })

});
