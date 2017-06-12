var Common = require('./common');
var VerticalToolbarExtension = require('./extensions/vertical.toolbar.extension');
var OAuth = require('./oauth');

class Viewer {

  constructor() {
    this.viewerApp = undefined;
    this.viewer = undefined;
    this.options = undefined;
    this.modelUrn = undefined;
    this.isyExtensions = ['VerticalToolbarExtension'];

    this.geometryLoaded = false;
    this.objectTreeCreated = false;

    this.initiate();
  };

  initiate() {
    this.onDocumentLoadedHandler = this.onDocumentLoaded.bind(this);
    this.onItemLoadedHandler = this.onItemLoaded.bind(this);
    this.onObjectTreeCreatedHandler = this.onObjectTreeCreated.bind(this);
  }

  unload() {
    if (this.viewer !== undefined) {
      this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onObjectTreeCreatedHandler);
      this.viewerApp.finish();
    }

    this.geometryLoaded = false;
    this.objectTreeCreated = false;

    this.viewerApp = undefined;
    this.viewer = undefined;
    this.options = undefined;
    this.modelUrn = undefined;
  }

  /**
   * Launches the viewer with the specified model (version).
   * Launching the viewer needs 3-legged authentication because we are accessing A360 files directly.
   * Template: https://github.com/Autodesk-Forge/model.derivative-nodejs-box.viewer/blob/master/www/js/viewer.js
   * 
   * @param {string} div - The id of the HTML div element to put the 2d/3d viewer into.
   * @param {string} urn - The URN of the model version to view.
   */
  launch(div, urn) {
    this.modelUrn = urn;
    this.options = {
      urn: 'urn:' + urn,
      env: 'AutodeskProduction',
      getAccessToken: OAuth.getForgeToken,
      webGLHelpLink: 'https://get.webgl.org/',
    };

    var self = this;
    Autodesk.Viewing.Initializer(this.options, onInitialized);

    /**
     * Creates a viewer application that is a wrapper for the viewer.
     */
    function onInitialized() {
      self.viewerApp = new Autodesk.Viewing.ViewingApplication(div);
      var viewerApp = self.viewerApp;
      var config = {};
      viewerApp.registerViewer(viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D, config);
      viewerApp.loadDocument(self.options.urn, self.onDocumentLoadedHandler, self.onError);
    }
  }

  onDocumentLoaded(doc) {
    var viewables = this.viewerApp.bubble.search({
      type: 'geometry'
    });

    if (viewables.length === 0) {
      console.log('Document contains no viewables.');
      return;
    }

    this.viewerApp.selectItem(viewables[0].data, this.onItemLoadedHandler, this.onError);
  }

  onItemLoaded(viewer, item) {
    this.viewer = viewer;
    this.loadExtensionsAndSettings(true);
  }

  loadExtensionsAndSettings(loadISY) {
    var viewer = this.viewer;
    if (viewer !== this.viewerApp.getCurrentViewer())
      console.error('Viewers are unequal');

    viewer.setReverseZoomDirection(true);
    viewer.utilities.fitToView(null);

    if (loadISY)
      this.loadISYExtensions();

    viewer.loadExtension('Autodesk.Viewing.ZoomWindow');
    viewer.loadExtension('Autodesk.Viewing.Collaboration');
    viewer.loadExtension('Autodesk.FirstPerson');
    viewer.loadExtension('Autodesk.Beeline');

    viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onObjectTreeCreatedHandler);
  }

  onObjectTreeCreated() {
    var control = this.viewer.toolbar.getControl('modelTools');
    control.removeControl('toolbar-explodeTool');

    control = this.viewer.toolbar.getControl('navTools');
    control.removeControl('toolbar-zoomTool');
  }

  loadISYExtensions() {
    var viewerApp = this.viewerApp;
    var viewer = this.viewer;
    if (viewer === undefined)
      return;

    this.isyExtensions.forEach(function (extension) {
      viewer.loadExtension(extension, viewerApp);
    });
  }

  unloadISYExtensions() {
    var viewer = this.viewer;
    if (viewer === undefined)
      return;

    var loadedExtensions = viewer.loadedExtensions;
    this.isyExtensions.forEach(function (extension) {
      if (extension in loadedExtensions)
        viewer.unloadExtension(extension);
    });
  }

  onError(error) {
    Common.onError(error);
  }

  /**
   * Gets the properties for all the given dbIds.
   * 
   * @param {array} dbIds The list of dbIds
   * @param {object} options The options (filtered list of properties)
   * @returns {array} List of sets of properties for each dbId
   */
  getBulkPropertiesAsync(dbIds, options) {
    var viewer = this.viewer;
    return new Promise(function (resolve, reject) {
      viewer.model.getBulkProperties(dbIds, options, function (result) {
        resolve(result);
      }, function (error) {
        reject(error)
      });
    });
  }

  /**
   * Gets the properties for one given dbId.
   * 
   * @param {int} dbId The dbId
   * @returns {array} The properties
   */
  getPropertiesAsync(dbId) {
    var viewer = this.viewer;
    return new Promise(function (resolve, reject) {
      viewer.getProperties(dbId, function (result) {
        resolve(result);
      }, function (error) {
        reject(error);
      });
    });
  }

  /**
   * Searches the viewer for items with the given properties (keys) and returns a list of items that has the given value for the one of the given properties.
   * 
   * @param {String} value The value to search for
   * @param {any} keys The keys to search in
   * @returns {array} A list of items that match the search
   */
  searchViewerAsync(value, keys) {
    var viewer = this.viewer;
    return new Promise(function (resolve, reject) {
      viewer.search(value, function (result) {
        resolve(result);
      }, function (error) {
        reject(error);
      }, keys);
    });
  }

  /**
   * Gets the viewables for this model, either 3d views or 2d views.
   * 
   * @param {any} role Either '3d' or '2d'
   * @returns
   */
  getViewables(role) {
    return this.viewerApp.bubble.search({
      'type': 'geometry',
      'role': role
    });
  }

  /**
   * Gets all the dbIds in the model.
   * http://adndevblog.typepad.com/cloud_and_mobile/2015/12/select-all-elements-in-the-viewer-with-view-and-data-api-with-javascript.html
   *  
   * @param {object} viewer The viewer instance
   * @returns {array} list of dbIds
   */
  getAllDbIds(viewer) {
    var instanceTree = viewer.model.getData().instanceTree;
    var rootId = instanceTree.getRootId();
    var alldbIds = [];

    if (!rootId) {
      return alldbIds;
    }

    var queue = [rootId];
    while (queue.length > 0) {
      var node = queue.shift();
      alldbIds.push(node);
      instanceTree.enumNodeChildren(node, function (childrenIds) {
        queue.push(childrenIds);
      });
    }

    return alldbIds;
  }

  /**
   * Gets the bounding box for a model item.
   * 
   * @param {int} dbId The dbId of the item
   * @returns {object} Bounding box for the item
   */
  getBoundingBox(dbId) {
    var frags = getFragmentsFromId(this.viewer, dbId);
    var bBox = getModifiedWorldBoundingBox(frags, this.viewer.model.getFragmentList());

    return bBox;
  }

  /**
   * Returns bounding box as it appears in the viewer (transformations could be applied).
   * 
   * @param {array} fragIds The fragments associated with a dbId
   * @param {array} fragList All the fragments in the model
   * @returns 
   */
  getModifiedWorldBoundingBox(fragIds, fragList) {
    var fragbBox = new THREE.Box3();
    var nodebBox = new THREE.Box3();

    for (var i = 0; i < fragIds.length; i++) {
      var fragId = fragIds[i];
      fragList.getWorldBounds(fragId, fragbBox);
      nodebBox.union(fragbBox);
    }

    return nodebBox;
  }

  getFragmentsFromId(viewer, dbId) {
    var instanceTree = viewer.model.getData().instanceTree;
    var frags = [];

    instanceTree.enumNodeFragments(dbId, function (fragId) {
      frags.push(fragId);
    }, false);

    return frags;
  }

  /**
   * VIEWER INTERACTIONS
   */

  hasViewer() {
    return this.viewer !== undefined;
  }

  addEventListener(eventName, handler) {
    this.viewer.addEventListener(eventName, handler);
  }

  removeEventListener(eventName, handler) {
    this.viewer.removeEventListener(eventName, handler);
  }

  clearSelection() {
    this.viewer.clearSelection();
  }

  fitToView(dbIds) {
    this.viewer.fitToView(dbIds);
  }

  getContainer() {
    return this.viewer.container;
  }

  getSelection() {
    return this.viewer.getSelection();
  }

  isolate(dbIds) {
    this.viewer.isolate(dbIds);
  }

  select(dbIds) {
    this.viewer.select(dbIds);
  }

  setThemingColor(dbId, color) {
    setThemingColor(this.viewer, dbId, color);
  }

  setThemingColor(viewer, dbId, color) {
    viewer.setThemingColor(dbId, color, viewer.model);
  }

  clearThemingColors() {
    this.viewer.clearThemingColors(this.viewer.model);
  }

  registerContextMenuCallback(id, callback) {
    this.viewer.registerContextMenuCallback(id, callback);
  }

  showAll() {
    this.viewer.showAll();
  }

  turnOn(dbIds) {
    toggleNodeOnOff(dbIds, this.viewer, false);
  }

  turnOff(dbIds) {
    toggleNodeOnOff(dbIds, this.viewer);
  }

  /**
   * Turns on or off nodes (dbIds) in the viewer.
   * 
   * @param {array} dbIds The dbIds
   * @param {object} viewer The viewer
   * @param {boolean} [off=true] Whether to turn the node off, or on
   */
  toggleNodeOnOff(dbIds, viewer, off = true) {
    var instanceTree = viewer.model.getData().instanceTree;

    if (Array.isArray(dbIds)) {
      for (var i = 0; i < dbIds.length; i++) {
        var id = dbIds[i];
        viewer.impl.visibilityManager.setNodeOff(id, off);
      }
    } else {
      viewer.impl.visibilityManager.setNodeOff(dbIds, off);
    }
  }
}

module.exports = Viewer;