module.exports = function (config) {


  const INDICATOR_CLASS = "drag-and-drop";;
  const STYLE_CLASS = config.STYLE_CLASS || "scribe-plugin-drag-and-drop-default-style";
  const EVENT_NAME = "scribe:url-dropped";
  const INSERT_POSITIONS = ['PRE', 'POST'];


  const filter = Array.prototype.filter;
  const forEach = Array.prototype.forEach;

  /**
   * Remove the pre and post paragraphs that we want to get rid of
   * @param {array} bindableElements - an array of elements that can be bound
   */
  function removePreAndPost(bindableElements) {
    let els = document.getElementsByClassName(INDICATOR_CLASS);

    forEach.call(els, (el) => {
      el.parentElement.removeChild(el);
    });

    bindableElements.forEach((el) => {
      el.dataset.pre = false; el.dataset.post = false;
    });
  }


  function checkDataset(el, pos) {
    return pos === "PRE" && el.dataset ? el.dataset.pre === "true"
      : el.dataset.post === "true";
  }

  function hasPreOrPost(el, pos) {

    if (pos === "PRE") {
      var checkPreviousSibling  =
            !!(el.previousSibling && !checkDataset(el.previousSibling, "POST"));
      return checkPreviousSibling && checkDataset(el, "PRE");
    }

    var checkNextSibling =
          !!(el.nextSibling && !checkDataset(el.nextSibling, "PRE"));
      return checkNextSibling && checkDataset(el, "POST");

  }


  /** CAUTION: Modifies the passed element
   * @param {element} el - the element to modify
   * @param {string} position - one of PRE or POST (before or after)
   * @return Boolean
   */
  function insertP(el, position, dropId) {
    var parent = el.parentElement;
    var p = document.createElement("p");

    //TODO: The para before a pre will have post true, the para after a post will have pre true

    p.classList.add(INDICATOR_CLASS);
    p.classList.add(STYLE_CLASS);

    if (position === "PRE" && !hasPreOrPost(el, position)) {
      parent.insertBefore(p, el);
      el.dataset.pre = true;
      return el.dataset.pre;
    }

    if (position === "POST" && !hasPreOrPost(el, position)) {
      parent.insertBefore(p, el.nextSibling);
      el.dataset.post = true;
      return el.dataset.post;
    }

    return false;
  }

  /**
   * Insert paragraphs around the passed element
   * @param{element} el - the element to wrap
   * @param{integer} dropid - the drop id of the element to bind
   */
  function addWrappingPs(el, dropid) {
    INSERT_POSITIONS
      .forEach((pos) => insertP(el, pos, dropid));
  }


  /**
   * Emit an event to inform listeners that a drop has occurred in the scribe
   * element.
   * @param {event} event - the original event
   * @param {array} element - an array of elements that can be bound
   *
   */
  function dropOccurred(event, bindableElements, dropid, scribe) {
    let el = event.target;
    let parent = el.parentElement;

    // all classes with the INDICATOR_CLASS will be removed
    // so this needs to be removed from the target element or
    // it will be set
    el.classList.remove(INDICATOR_CLASS);
    el.classList.remove(STYLE_CLASS);


    // no clue why this needs to run twice
    scribe.transactionManager.run(() => removePreAndPost(bindableElements));

    var droppedUrl = event.dataTransfer.getData('URL');
    event.target.textContent = droppedUrl;
    var customEvent = new CustomEvent(EVENT_NAME,
                                      { 'detail': {
                                        dataTransfer: event.dataTransfer,
                                        element: event.target }
                                      });

    parent.dispatchEvent(customEvent);

  }

  /**
   * Delegate an event handler to a child element
   * @param {element} - the parent element
   * @param {string} - the eventType to listen to
   * @param {selector}
   * @param {function}
   */
  function delegate(element, eventType, selector, callback) {
    element.addEventListener(eventType, function (event) {
      if (event.target.matches(selector)) {
        callback.call(event.target, event);
      }
    });
  }

  return {
    removePreAndPost: removePreAndPost,
    addWrappingPs: addWrappingPs,
    dropOccurred: dropOccurred,
    delegate: delegate
  };
};
