'use strict';

Tinytest.add('bililiteRange', function (test) {
  var el = document.createElement('input');
  var br = bililiteRange(el);
  test.equal(br._el, el, 'Instantiation OK');
});
