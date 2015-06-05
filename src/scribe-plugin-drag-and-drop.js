/* global module, document, window, CustomEvent */
/* esnext = true */


module.exports = function(config) {

  // used to say what element can be dragged into
  const NODE_NAME = 'P';
  const INSERT_POSITIONS = ['PRE', 'POST'];
  const INDICATOR_CLASS = "drag-and-drop";
  const EVENT_NAME = "scribe:url-dropped";

  // class to apply to the drop areas to style them
  const STYLE_CLASS = config.class;

  const filter = Array.prototype.filter;
  const forEach = Array.prototype.forEach;

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
      removePreAndPost();
      // this is used to determine which elements are being dropped on
      bindableElements().forEach((el, index) => {el.dataset.dropid = index;});
    };

    /** CAUTION: Modifies the passed element
     * @param {element} el - the element to modify
     * @param {string} position - one of PRE or POST (before or after)
     * @return Boolean
     */
    function insertP(el, position, dropId) {
      let p = document.createElement("p");

      p.classList.add(INDICATOR_CLASS);
      p.classList.add(dropId);
      p.classList.add(STYLE_CLASS);

      if (position === "PRE" && el.dataset && el.dataset.pre !== "true") {
        scribe.el.insertBefore(p, el);
        el.dataset.pre = true;
        return el.dataset.pre;
      }

      if (position === "POST" && el.dataset && el.dataset.post !== "true" ) {
        scribe.el.insertBefore(p, el.nextSibling);
        el.dataset.post = true;
        return el.dataset.post;
      }

      return false;
    }

    function removePreAndPost(dragId) {
      let els = document.getElementsByClassName(INDICATOR_CLASS);

      forEach.call(els, (el) => {
        if(!el.classList.contains(dragId)) {
          el.parentNode.removeChild(el);
        }
      });

      bindableElements().forEach((el) => {
        if(!el.classList.contains(dragId)) {
          el.dataset.pre = false; el.dataset.post = false;
        }
      });
    }

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
      if(!isEmpty(event.target) && CURRENT_DROP_ID !== dropid) {
        removePreAndPost();
        INSERT_POSITIONS.forEach((pos) =>
                                 insertP(el, pos, dropid));
        CURRENT_DROP_ID = dropid;
      }
    });


    scribe.el.addEventListener('dragleave', (event) => {
      console.log("drag over on: ", event.target.dataset.dropid);
      console.log("CURRENT_DROP_ID: ", CURRENT_DROP_ID);
      //removePreAndPost(event.target.dataset.dropid);
    });


    scribe.el.addEventListener('drop', (event) => {
      let el = event.target;

      // all classes with the INDICATOR_CLASS will be removed
      // so this needs to be removed from the target element or
      // it will be set
      el.classList.remove(INDICATOR_CLASS);
      el.classList.remove(STYLE_CLASS);


      // no clue why this needs to run twice
      window.setTimeout(removePreAndPost, 100);
      window.setTimeout(removePreAndPost, 500);

      var droppedUrl = event.dataTransfer.getData('URL');
      var customEvent = new CustomEvent(EVENT_NAME, {url: droppedUrl});

      scribe.el.dispatchEvent(customEvent);

      // reset everything
      bindDropIds();
    });


    // can't really figure out when this is fired so probs best to ditch it
    scribe.el.addEventListener('dragend', () => {
      removePreAndPost();
    });

    console.log("bindable elements: ", bindableElements());
  };

};
