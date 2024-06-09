'use strict';

describe('Component: PhoneNameComponent', function () {

  // load the controller's module
  beforeEach(module('newsimpleApp'));

  var PhoneNameComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($componentController) {
    PhoneNameComponent = $componentController('phoneName', {});
  }));

  it('should ...', function () {
    expect(1).to.equal(1);
  });
});
