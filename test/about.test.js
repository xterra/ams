const expect = require('chai').expect,
  about = require('../templates/test/processors/about.js');

describe('Testing about.js', () => {
  describe('about.js -> path', () => {
    const regExp = about.path;
    describe('passing "/about/"', () => {
      it('expect true', () => {
        expect(regExp.test('/about/')).to.be.true;
      });
    });
    describe('passing "/about/#foobar"', () => {
      it('expect true', () => {
        expect(regExp.test('/about/')).to.be.true;
      });
    });
    describe('passing "/about"', () => {
      it('expect false', () => {
        expect(regExp.test('/about')).to.be.false;
      });
    });
    describe('passing "/about/about/"', () => {
      it('expect false', () => {
        expect(regExp.test('/about/about/')).to.be.false;
      });
    });
  });

  describe('about.js -> processor', () => {
    const request = {},
      response = {},
      db = {};
    describe('check common fields', () => {
      const sessionToken = null,
        sessionContext = undefined;
      it('expect processedData.title="О нас"', (done) => {
        about.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(processedData.title).to.equal('О нас');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect sheathName="about"', (done) => {
        about.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(sheathName).to.equal('about');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect serverCacheTime=5', (done) => {
        about.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(serverCacheTime).to.equal(5);
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect clientCacheTime=5', (done) => {
        about.processor(request, response,
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
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={}', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = {};
      it('expect processedData.userAthorized=false', (done) => {
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext=undefined', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = undefined;
      it('expect processedData.userAthorized=false', (done) => {
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext=null', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = null;
      it('expect processedData.userAthorized=false', (done) => {
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken=undefined and sessionContext={ id : 1 }', () => {
      const sessionToken = undefined,
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=false', (done) => {
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={ id : 1 }', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=true', (done) => {
        about.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.true;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
  });
});
