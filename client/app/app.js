'use strict';

angular.module('newsimpleApp', ['newsimpleApp.auth', 'newsimpleApp.admin', 'newsimpleApp.constants',
    'ngCookies', 'ngResource', 'ngSanitize', 'btford.socket-io', 'ui.router', 'ui.bootstrap', 'angularMoment', 
  'luegg.directives', 'angular-web-notification',
    'validation.match'
  ])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true);
  });
