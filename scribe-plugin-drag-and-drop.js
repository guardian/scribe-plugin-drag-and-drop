(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginContentCleaner = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = function (config) {

  var INDICATOR_CLASS = "drag-and-drop";;
  var STYLE_CLASS = config.style_class || "scribe-plugin-drag-and-drop-default-style";
  var EVENT_NAME = "scribe:url-dropped";
  var INSERT_POSITIONS = ["PRE", "POST"];

  var filter = Array.prototype.filter;
  var forEach = Array.prototype.forEach;

  /**
   * Remove the pre and post paragraphs that we want to get rid of
   * @param {array} bindableElements - an array of elements that can be bound
   */
  function removePreAndPost(bindableElements) {
    var els = document.getElementsByClassName(INDICATOR_CLASS);

    forEach.call(els, function (el) {
      el.parentElement.removeChild(el);
    });

    bindableElements.forEach(function (el) {
      el.dataset.pre = false;el.dataset.post = false;
    });
  }

  function checkDataset(el, pos) {
    return pos === "PRE" && el.dataset ? el.dataset.pre === "true" : el.dataset.post === "true";
  }

  function hasPreOrPost(el, pos) {

    if (pos === "PRE") {
      var checkPreviousSibling = !!(el.previousSibling && !checkDataset(el.previousSibling, "POST"));
      return checkPreviousSibling && checkDataset(el, "PRE");
    }

    var checkNextSibling = !!(el.nextSibling && !checkDataset(el.nextSibling, "PRE"));
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
    INSERT_POSITIONS.forEach(function (pos) {
      return insertP(el, pos, dropid);
    });
  }

  /**
   * Emit an event to inform listeners that a drop has occurred in the scribe
   * element.
   * @param {event} event - the original event
   * @param {array} element - an array of elements that can be bound
   *
   */
  function dropOccurred(event, bindableElements, dropid, scribe) {
    var el = event.target;
    var parent = el.parentElement;

    // all classes with the INDICATOR_CLASS will be removed
    // so this needs to be removed from the target element or
    // it will be set
    el.classList.remove(INDICATOR_CLASS);
    el.classList.remove(STYLE_CLASS);

    // no clue why this needs to run twice
    scribe.transactionManager.run(function () {
      return removePreAndPost(bindableElements);
    });

    var droppedUrl = event.dataTransfer.getData("URL");
    event.target.textContent = droppedUrl;
    var customEvent = new CustomEvent(EVENT_NAME, { detail: {
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

},{}],2:[function(require,module,exports){
/* global module, document, window, CustomEvent */
/* esnext = true */

"use strict";

module.exports = function (config) {
  var helpers = require("./helpers")(config);

  // used to say what element can be dragged into
  var NODE_NAME = "P";

  var filter = Array.prototype.filter;

  return function (scribe) {
    // used to know if a drop's going on - cleared when they've moved elsewhere
    var CURRENT_DROP_ID = undefined;
    var dragHandler = undefined; // so we can track when a drag is happening
    var isEmpty = function (el) {
      return el.childNodes.length === 0;
    };
    var bindableElements = function () {
      return filter.call(scribe.el.children, function (child) {
        return child.nodeName === NODE_NAME;
      });
    };

    // clean up the classes
    var cleanup = function () {
      // drop is not longer happening
      CURRENT_DROP_ID = null;
      helpers.removePreAndPost(bindableElements());

      bindableElements().forEach(function (el) {
        el.removeAttribute("data-pre");
        el.removeAttribute("data-post");
        el.removeAttribute("data-dropid");
      });
    };

    var bindDropIds = function () {
      cleanup();
      // this is used to determine which elements are being dropped on
      bindableElements().forEach(function (el, index) {
        el.dataset.dropid = index;
      });
    };

    //rebind when the content changes
    scribe.on("content-changed", function () {
      if (!CURRENT_DROP_ID) {
        bindDropIds();
      }
    });

    // bind the drop ids as soon as scribe is ready
    scribe.transactionManager.run(function () {
      bindDropIds();
    });

    helpers.delegate(scribe.el, "dragenter", "p", function (event) {
      event.preventDefault();

      var el = event.target;
      var dropid = el.dataset.dropid || null;

      if (!dropid) {
        return;
      }

      if (isEmpty(el)) {
        el.classList.add(config.style_class);
        return;
      }

      // CURRENT_DROP_ID prevents execssive paragraphs from being inserted
      // and means paragraphs will only be inserted around existing paragraphs
      // if you don't do this  you'll get an endless array of empty paragraphs
      if (!isEmpty(el) && CURRENT_DROP_ID !== dropid) {
        helpers.removePreAndPost(bindableElements());
        helpers.addWrappingPs(el, dropid);
        CURRENT_DROP_ID = dropid;
      }
    });

    helpers.delegate(scribe.el, "drop", "p", function (event) {
      event.preventDefault();
      helpers.dropOccurred(event, bindableElements(), CURRENT_DROP_ID, scribe);
      // reset everything
      bindDropIds();
    });

    helpers.delegate(scribe.el, "dragover", "p", function (event) {
      if (event.target.className.indexOf(config.style_class) !== -1 && event.target.className.indexOf(config.hover_class) === -1) {
        event.target.classList.add(config.hover_class);
      }
    });

    helpers.delegate(scribe.el, "dragleave", "p", function (event) {
      if (event.target.className.indexOf(config.style_class) !== -1 && event.target.className.indexOf(config.hover_class) !== -1) {
        event.target.classList.remove(config.hover_class);
      }
    });

    document.addEventListener("dragend", function () {
      scribe.transactionManager.run(function () {
        cleanup();
      });
    });
  };
};

},{"./helpers":1}]},{},[2])(2)
});