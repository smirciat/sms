'use strict';

angular.module('newsimpleApp.auth', ['newsimpleApp.constants', 'newsimpleApp.util', 'ngCookies',
    'ui.router'
  ])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
