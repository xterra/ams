const expect = require('chai').expect,
  abiturients = require('../templates/test/processors/abiturients.js');

describe('Testing abiturients.js', () => {
  describe('abiturients.js -> path', () => {
    const regExp = abiturients.path;
    describe('passing "/for-abiturients/"', () => {
      it('expect true', () => {
        expect(regExp.test('/for-abiturients/')).to.be.true;
      });
    });
    describe('passing "/for-abiturients/#foobar"', () => {
      it('expect true', () => {
        expect(regExp.test('/for-abiturients/')).to.be.true;
      });
    });
    describe('passing "/for-abiturients"', () => {
      it('expect false', () => {
        expect(regExp.test('/for-abiturients')).to.be.false;
      });
    });
    describe('passing "/root/for-abiturients/"', () => {
      it('expect false', () => {
        expect(regExp.test('/root/for-abiturients/')).to.be.false;
      });
    });
  });

  describe('abiturients.js -> processor', () => {
    const request = {},
      response = {},
      db = {};
    describe('check common fields', () => {
      const sessionToken = null,
        sessionContext = undefined;
      it('expect processedData.title="Абитуриентам"', (done) => {
        abiturients.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(processedData.title).to.equal('Абитуриентам');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect sheathName="abiturients"', (done) => {
        abiturients.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(sheathName).to.equal('abiturients');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect serverCacheTime=5', (done) => {
        abiturients.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(serverCacheTime).to.equal(5);
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect clientCacheTime=5', (done) => {
        abiturients.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(clientCacheTime).to.equal(5);
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken=null and sessionContext=undefined', () => {
      const sessionToken = null,
        sessionContext = undefined;
      it('expect processedData.userAthorized=false', (done) => {
        abiturients.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={}', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = {};
      it('expect processedData.userAthorized=false', (done) => {
        abiturients.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext=undefined', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = null;
      it('expect processedData.userAthorized=false', (done) => {
        abiturients.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken=undefined and sessionContext={ id : 1 }', () => {
      const sessionToken = undefined,
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=false', (done) => {
        abiturients.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={ id : 1 }', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=true', (done) => {
        abiturients.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.true;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
  });
});
