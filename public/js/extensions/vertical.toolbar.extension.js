require('css/vertical.toolbar.extension.css');

import ExtensionBase from './extension.base';
var VerticalToolbar = require('../vertical.toolbar');

/**
 * A vertical toolbar extension of the Forge viewer.
 * 
 * Templates: 
 * https://developer.autodesk.com/en/docs/viewer/v2/tutorials/extensions/, 
 * http://through-the-interface.typepad.com/through_the_interface/2016/05/creating-a-vertical-toolbar-extension-for-the-autodesk-viewer.html, 
 * http://adndevblog.typepad.com/cloud_and_mobile/2014/08/a-better-way-to-add-custom-toolbar-for-autodesk-viewer.html
 * 
 * @param {object} viewer The viewer.
 * @param {object} options The options sent from the viewer app to the extension.
 */
class VerticalToolbarExtension extends ExtensionBase {
  constructor(viewer, options) {
    super(viewer, options)

    this.verticalToolbar = new VerticalToolbar(viewer, options);
  }

  load() {
    this.verticalToolbar.createToolbar();

    return true;
  }

  unload() {
    this.verticalToolbar.removeToolbar();
    this.verticalToolbar = null;

    return true;
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('VerticalToolbarExtension', VerticalToolbarExtension);