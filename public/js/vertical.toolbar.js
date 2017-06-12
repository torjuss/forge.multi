var Common = require('./common');

class VerticalToolbar {
  constructor(viewer, options) {
    this.config = {
      'id': 'vertical-toolbar',
      'collapsible': false,
      'containerId': 'vertical-toolbar-container',
      'viewsToolbar': {
        'id': 'views-sub-toolbar',
        'isRadio': false,
        'visible': true,
        'buttons': [{
            'id': 'views-3d-btn',
            'class': 'views-btn',
            'role': '3d',
            'text': '3D',
            'tooltip': '3D views',
            'iconClass': 'glyphicon glyphicon-globe',
          },
          {
            'id': 'views-2d-btn',
            'class': 'views-btn',
            'role': '2d',
            'text': '2D',
            'tooltip': '2D views',
            'iconClass': 'glyphicon glyphicon-picture',
          }
        ]
      }
    };
  }

  get viewer() {
    return _viewer;
  }

  removeToolbar() {
    $('#' + this.config.containerId).remove();
  }

  createToolbar() {
    // Get the 2d and 3d viewables for the model.
    var config = this.config;
    var viewableCount = 0;
    var viewables3d = this.viewer.getViewables('3d');
    var viewables2d = this.viewer.getViewables('2d');
    var has3ds = viewables3d != null && viewables3d.length > 0;
    var has2ds = viewables2d != null && viewables2d.length > 0;
    if (has3ds)
      viewableCount += viewables3d.length;
    if (has2ds)
      viewableCount += viewables2d.length;

    // Hide the toolbar if there is only one view of the model.
    if (viewableCount < 2)
      return;

    // Create toolbar.
    var toolbarContainer = $('#' + config.containerId);
    var uiToolbar = new Autodesk.Viewing.UI.ToolBar(config.id, null, config.collapsible);

    // Add sub toolbar for views.
    var viewsToolbarConfig = config.viewsToolbar;
    var uiViewsToolbar = new Autodesk.Viewing.UI.ControlGroup(viewsToolbarConfig.id, null);
    uiViewsToolbar.addClass('toolbar-vertical-group');

    var self = this;

    // Add combo button for 2d and for 3d.
    viewsToolbarConfig.buttons.forEach(function (bConfig) {
      var viewables = bConfig.role == '3d' ? viewables3d : viewables2d;
      if (viewables == null || viewables.length < 1)
        return;

      var uiComboButton = self.createButton(bConfig.tooltip, bConfig.id, bConfig.class, bConfig.iconClass, true, null);
      var count = 0;

      // Add buttons for each view.
      viewables.forEach(function (viewable) {
        var id = bConfig.id + '-' + count;
        var onClickHandler = self.loadViewable.bind(self);
        var uiViewableButton = self.createButton(viewable.data.name, id, 'sub-views-btn', 'glyphicon glyphicon-file', false, onClickHandler);
        uiComboButton.addControl(uiViewableButton);
        // Custom properties to use for identifying a specific view when corresponding button is clicked.
        $(uiViewableButton.container).attr('data-id', count).attr('data-role', bConfig.role);
        count++;
      });

      uiViewsToolbar.addControl(uiComboButton);
    });

    // Add the sub toolbar with the 2d and 3d views.
    uiToolbar.addControl(uiViewsToolbar);

    // Create the toolbar container and add it to the viewer container.
    if (toolbarContainer.length == 0) {
      toolbarContainer = $('<div id="' + config.containerId + '"></div>');
      var container = this.viewer.getContainer();
      $(container).append(toolbarContainer);
    }

    // Add the toolbar to the toolbar container.
    toolbarContainer.append(uiToolbar.container);

    //HACK: This makes the toolbar fit in the viewer when both 2d and 3d models are present.
    if (has2ds && has3ds)
      toolbarContainer.css('top', '126px');
  };

  createButton(title, id, cssClass, cssIconClass, isCombo, onClick = null) {
    var button = isCombo ? new Autodesk.Viewing.UI.ComboButton(id) : new Autodesk.Viewing.UI.Button(id);
    button.addClass(cssClass);
    button.setToolTip(title);
    button.icon.className = cssIconClass;
    button.onClick = onClick;

    button.onMouseOver = this.onMouseOver;
    button.onMouseOut = this.onMouseOut;

    return button;
  }

  /**
   * Loads a viewable of a model.
   * 
   * @param {event} event The event to handle.
   */
  loadViewable(event) {
    var target = $(event.currentTarget);
    var role = target.attr('data-role');
    var index = target.attr('data-id');
    index = parseInt(index);
    var viewables = this.viewer.getViewables(role);
    this.viewer.viewerApp.selectItem(viewables[index].data, this.onViewableLoadSuccess.bind(this), Common.onError);
  }

  onMouseOver(event) {
    $('#' + this._id + 'SubMenu').removeClass('adsk-hidden');
  }

  onMouseOut(event) {
    $('#' + this._id + 'SubMenu').addClass('adsk-hidden');
  }

  onViewableLoadSuccess(viewer, item) {
    this.viewer.loadExtensionsAndSettings(true);
  }
}

module.exports = VerticalToolbar;