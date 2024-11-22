define(function(require) {
  return function DialogPromise($dialog) {
    let promise = new Promise(function(resolve, reject) {
      let cb = (evt) => { resolve($(evt.target).data('reason') ) };

      $dialog.one('hidden.bs.modal', () => { reject() });
      $dialog.find('button[data-resolve=modal]')
        .off('click', cb)
        .one('click', cb);
    });
    let result = _.merge($dialog, { promise: promise, });

    return result;
  };
});
