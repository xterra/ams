const expect = require('chai').expect,
  contacts = require('../templates/test/processors/contacts.js');

describe('Testing contacts.js', () => {
  describe('contacts.js -> path', () => {
    const regExp = contacts.path;
    describe('passing "/contacts/"', () => {
      it('expect true', () => {
        expect(regExp.test('/contacts/')).to.be.true;
      });
    });
    describe('passing "/contacts/#foobar"', () => {
      it('expect true', () => {
        expect(regExp.test('/contacts/')).to.be.true;
      });
    });
    describe('passing "/contacts"', () => {
      it('expect false', () => {
        expect(regExp.test('/contacts')).to.be.false;
      });
    });
    describe('passing "/contacts/contacts/"', () => {
      it('expect false', () => {
        expect(regExp.test('/contacts/contacts/')).to.be.false;
      });
    });
  });

  describe('contacts.js -> processor', () => {
    const request = {},
      response = {},
      db = {};
    describe('check common fields', () => {
      const sessionToken = null,
        sessionContext = undefined;
      it('expect processedData.title="Контакты"', (done) => {
        contacts.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(processedData.title).to.equal('Контакты');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect sheathName="contacts"', (done) => {
        contacts.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(sheathName).to.equal('contacts');
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect serverCacheTime=5', (done) => {
        contacts.processor(request, response,
          (processedData, sheathName, serverCacheTime, clientCacheTime) =>{
          expect(serverCacheTime).to.equal(5);
          done();
        }, sessionContext, sessionToken, db);
      });
      it('expect clientCacheTime=5', (done) => {
        contacts.processor(request, response,
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
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={}', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = {};
      it('expect processedData.userAthorized=false', (done) => {
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext=undefined', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = undefined;
      it('expect processedData.userAthorized=false', (done) => {
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext=null', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = null;
      it('expect processedData.userAthorized=false', (done) => {
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken=undefined and sessionContext={ id : 1 }', () => {
      const sessionToken = undefined,
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=false', (done) => {
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.false;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
    describe('passing sessionToken="vBGTPzJys" and sessionContext={ id : 1 }', () => {
      const sessionToken = "vBGTPzJys",
        sessionContext = { id: 1 };
      it('expect processedData.userAthorized=true', (done) => {
        contacts.processor(request, response, (processedData) =>{
          expect(processedData.userAthorized).to.be.true;
          done();
        }, sessionContext, sessionToken, db);
      });
    });
  });
});
