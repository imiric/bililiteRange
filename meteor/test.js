'use strict';

Tinytest.add('jquery-sendkeys', function (test) {
  var el = $(document.createElement('input'));
  el.sendkeys('test');
  test.equal(el.val(), 'test', 'Instantiation OK');
});
