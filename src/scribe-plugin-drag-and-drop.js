/* global module, document, window, CustomEvent */
/* esnext = true */


module.exports = function(config) {
  var helpers = require('./helpers')(config);

  // used to say what element can be dragged into
  const NODE_NAME = 'P';

  const filter = Array.prototype.filter;

  return function(scribe) {
    // used to know if a drop's going on - cleared when they've moved elsewhere
    let CURRENT_DROP_ID;
    let dragHandler; // so we can track when a drag is happening
    let isEmpty = (el) => el.childNodes.length === 0;
    let bindableElements = () => filter.call(scribe.el.children,
                                             (child) => child.nodeName === NODE_NAME);

    // clean up the classes
    let cleanup = () => {
      // drop is not longer happening
      CURRENT_DROP_ID = null;
      helpers.removePreAndPost(bindableElements());

      bindableElements().forEach((el) => {
        el.removeAttribute("data-pre");
        el.removeAttribute("data-post");
        el.removeAttribute("data-dropid");
      });
    };

    let bindDropIds = () => {
      cleanup();
      // this is used to determine which elements are being dropped on
      bindableElements().forEach((el, index) => {el.dataset.dropid = index;});
    };


    //rebind when the content changes
    scribe.on('content-changed', () => {
      if (!CURRENT_DROP_ID) {
        bindDropIds();
      }
    });

    // bind the drop ids as soon as scribe is ready
    scribe.transactionManager.run(() => {bindDropIds();});

    helpers.delegate(scribe.el, 'dragenter', 'p', (event) => {
      event.preventDefault();


      let el = event.target;
      let dropid = el.dataset.dropid || null;

      if(!dropid) {
        return;
      }

      if(isEmpty(el)) {
        el.classList.add(config.style_class);
        return;
      }

      // CURRENT_DROP_ID prevents execssive paragraphs from being inserted
      // and means paragraphs will only be inserted around existing paragraphs
      // if you don't do this  you'll get an endless array of empty paragraphs
      if(!isEmpty(el) && CURRENT_DROP_ID !== dropid) {
        helpers.removePreAndPost(bindableElements());
        helpers.addWrappingPs(el, dropid);
        CURRENT_DROP_ID = dropid;
      }
    });

    helpers.delegate(scribe.el, 'drop', 'p', (event) => {
      event.preventDefault();
      helpers.dropOccurred(event, bindableElements(), CURRENT_DROP_ID, scribe);
      // reset everything
      bindDropIds();
    });


    helpers.delegate(scribe.el, "dragover", "p", function (event) {
      if(event.target.className.indexOf(config.style_class) !== -1
         && event.target.className.indexOf(config.hover_class) === -1) {
        event.target.classList.add(config.hover_class);
      }
    });

    helpers.delegate(scribe.el, "dragleave", "p", function (event) {
      if(event.target.className.indexOf(config.style_class) !== -1
         && event.target.className.indexOf(config.hover_class) !== -1) {
        event.target.classList.remove(config.hover_class);
      }
    });

    document.addEventListener('dragend', () => {
      scribe.transactionManager.run(() => { cleanup(); });
    });
  };

};
