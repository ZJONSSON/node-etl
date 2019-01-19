module.exports = function wrap(cls) {
  return function() {
    return new cls(...arguments);
  };
};