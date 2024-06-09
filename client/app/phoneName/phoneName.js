'use strict';

angular.module('newsimpleApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('phoneName', {
        url: '/phoneName',
        template: '<phone-name></phone-name>'
      });
  });
