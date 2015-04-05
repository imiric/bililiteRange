// package metadata file for Meteor.js
'use strict';

var packageName = 'bililiterange:bililiterange';
var where = 'client';

Package.describe({
  name: packageName,
  summary: 'Library for manipulating text ranges and selections',
  version: '2.6.0',
  git: 'https://github.com/dwachss/bililiteRange.git'
});

Package.onUse(function (api) {
  api.versionsFrom('1.0');
  api.export('bililiteRange');
  api.addFiles([
    'bililiteRange.js'
  ], where
  );
});

Package.onTest(function (api) {
  api.use(packageName, where);
  api.use('tinytest', where);

  api.addFiles('meteor/test.js', where);
});
