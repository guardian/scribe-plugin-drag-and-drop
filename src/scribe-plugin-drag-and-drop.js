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

    let isEmpty = (el) => el.childNodes.length === 0;
    let bindableElements = () => filter.call(scribe.el.children,
                                       (child) => child.nodeName === NODE_NAME);

    // clean up the classes
    let cleanup = () => {
      bindableElements().forEach((el) => {
        delete el.dataset.pre;
        delete el.dataset.post;
        delete el.dataset.dropid;
      });
    };

    let bindDropIds = () => {
      cleanup();
      helpers.removePreAndPost(bindableElements());
      // this is used to determine which elements are being dropped on
      bindableElements().forEach((el, index) => {el.dataset.dropid = index;});
    };


    // bind the drop ids as soon as scribe is ready
    bindDropIds();

    scribe.el.addEventListener('dragenter', (event) => {
      let el = event.target;
      let dropid = el.dataset.dropid || null;

      if(!dropid) {
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

    scribe.el.addEventListener('drop', (event) => {
      helpers.dropOccurred(event, bindableElements(), CURRENT_DROP_ID);
      // reset everything
      bindDropIds();
    });


    // can't really figure out when this is fired so probs best to ditch it
    scribe.el.addEventListener('dragend', () => {
      helpers.removePreAndPost(bindableElements());
    });

    console.log("bindable elements: ", bindableElements());
  };

};
