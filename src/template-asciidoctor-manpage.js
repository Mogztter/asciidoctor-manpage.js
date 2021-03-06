// UMD Module
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory;
    module.exports.register = factory;
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register a named module.
    define('asciidoctor/docbook', ['asciidoctor'], function () {
      return factory();
    });
  } else {
    // Browser globals (root is window)
    if (typeof root.Asciidoctor === 'undefined') {
      throw new Error('Asciidoctor.js should be loaded before Asciidoctor ManPage.js');
    }
    root.Asciidoctor.DocBook = factory;
  }
}(this, function () {
//#{asciidoctorManPageCode}

  return {};
}));
