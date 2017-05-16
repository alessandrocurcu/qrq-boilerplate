function empty( elem ) {
  while ( elem.firstChild ) {
    elem.removeChild( elem.firstChild );
  }
}

function bind(element, event, callback, useCapture) {
  if (element.addEventListener) {
      element.addEventListener(event, callback, useCapture);
  } else {
    // IE8 fallback
    element.attachEvent('on' + event, function(event) {
      // `event` and `event.target` are not provided in IE8
      event = event || window.event;
      event.target = event.target || event.srcElement;
      callback(event);
    });
  }
}

function unbind(element, event, callback, useCapture) {
  if (element.removeEventListener) {
    element.removeEventListener(event, callback, useCapture);
  } else {
    // IE8 fallback
    element.detachEvent('on' + event, callback);
  }
}

function qrq_create(element) {
  return document.createElement(element);
}

