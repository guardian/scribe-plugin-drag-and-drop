# Scribe Plugin Drag and Drop

## Usage:

This plugin for [scribe](https://github.com/guardian/scribe) adds the
ability to drag and drop urls. It emits the event
```scribe:url-dropped``` when a URL has been dropped. The
```dataTransfer``` object is attached to the detail of this event.

The plugin works by inserting paragraphs around the target and then
removing those paragraphs when a drop occurs. It marks up the content
with ```data-``` attributes so these need to be manually removed after use
