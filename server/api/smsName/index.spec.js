'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var smsNameCtrlStub = {
  index: 'smsNameCtrl.index',
  show: 'smsNameCtrl.show',
  create: 'smsNameCtrl.create',
  update: 'smsNameCtrl.update',
  destroy: 'smsNameCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var smsNameIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './smsName.controller': smsNameCtrlStub
});

describe('SmsName API Router:', function() {

  it('should return an express router instance', function() {
    expect(smsNameIndex).to.equal(routerStub);
  });

  describe('GET /api/smsNames', function() {

    it('should route to smsName.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'smsNameCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/smsNames/:id', function() {

    it('should route to smsName.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'smsNameCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

  describe('POST /api/smsNames', function() {

    it('should route to smsName.controller.create', function() {
      expect(routerStub.post
        .withArgs('/', 'smsNameCtrl.create')
        ).to.have.been.calledOnce;
    });

  });

  describe('PUT /api/smsNames/:id', function() {

    it('should route to smsName.controller.update', function() {
      expect(routerStub.put
        .withArgs('/:id', 'smsNameCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('PATCH /api/smsNames/:id', function() {

    it('should route to smsName.controller.update', function() {
      expect(routerStub.patch
        .withArgs('/:id', 'smsNameCtrl.update')
        ).to.have.been.calledOnce;
    });

  });

  describe('DELETE /api/smsNames/:id', function() {

    it('should route to smsName.controller.destroy', function() {
      expect(routerStub.delete
        .withArgs('/:id', 'smsNameCtrl.destroy')
        ).to.have.been.calledOnce;
    });

  });

});
