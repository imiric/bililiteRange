// package metadata file for Meteor.js
'use strict';

var packageName = 'bililiterange:jquery-sendkeys';
var where = 'client';

Package.describe({
  name: packageName,
  summary: 'Library for simulating keypresses in a browser',
  version: '4.0.1',
  git: 'https://github.com/dwachss/bililiteRange.git'
});

Package.onUse(function (api) {
  api.versionsFrom('1.0');
  api.use('jquery', 'client');
  api.imply('jquery', 'client');
  api.use('bililiterange:bililiterange@2.6.1', 'client');
  api.imply('bililiterange:bililiterange', 'client');
  api.addFiles([
    'jquery.sendkeys.js'
  ], where
  );
});

Package.onTest(function (api) {
  api.use(packageName, where);
  api.use('tinytest', where);

  api.addFiles('meteor/test.js', where);
});
