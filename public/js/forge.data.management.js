var OAuth = require('./oauth');
var Common = require('./common');

/**
 * Template: https://github.com/Autodesk-Forge/data.management-nodejs-integration.box/blob/master/www/js/forge.data.management.js
 */

class DataManagement {
  constructor() {
    this.projects = {};
    this.re = /(?:\.([^.]+))?$/; // regex to extract file extension
  };

  initiate() {
    if (OAuth.getForgeToken() != '') {
      this.projects = {};
      this.changeModelHandler = this.changeModel.bind(this);
      this.changeProjectHandler = this.changeProject.bind(this);
      this.refreshFilesHandler = this.refreshFiles.bind(this);

      this.addProjectsAndModels();
      Common.notify('Loading A360 projects...', 'info');

      $('#refresh-files-btn').click(this.refreshFilesHandler);
      $('#projects-menu').change(this.changeProjectHandler);
      $('#models-menu').change(this.changeModelHandler);
    }
  }

  refreshFiles() {
    this.addProjectsAndModels(function () {
      Common.notify('Files refreshed', 'success');
    });

    Common.notify('Refreshing files...', 'info');
  }

  changeModel(event) {
    // Hide navigation menu after selecting model (because the navigation menu overlaps with the viewer).
    if ($(window).width() <= 768)
      $('#nav-links').removeClass('in');

    _viewer.unload();

    var target = Common.getEventTarget(event);
    var model = target.options[target.selectedIndex];
    if (model == null || model == undefined) return;

    var fileName = model.text;
    var versionId = model.value;
    this.translateFile(versionId, fileName);
  }

  changeProject(event) {
    var target = Common.getEventTarget(event);
    var projectId = target.value;
    var project = this.projects[projectId];
    this.getProjectModels(project, this.addModels);
  }

  /**
   * Adds projects and models to comboboxes in the GUI.
   * 
   * @param {callback} notifyRefresh If defined; Use this to notify the GUI about file refresh
   */
  addProjectsAndModels(notifyRefresh) {
    this.getProjects(this.onProjectsFetched.bind(this), notifyRefresh);
  }

  /**
   * Requests projects and hubs from the server.
   * 
   * @param {callback} onsuccess Callback for successful retrieval of projects and hubs
   * @param {callback} notifyRefresh If defined; Use this to notify the GUI about file refresh
   */
  getProjects(onsuccess, notifyRefresh) {
    $.ajax({
      url: '/user/getMyFiles',
      success: function (data) {
        onsuccess(data);

        if (notifyRefresh != undefined)
          notifyRefresh();
        else
          Common.notify('Successfully loaded A360 projects', 'success');
      },
      error: function () {
        if (notifyRefresh != undefined)
          Common.onError('Unable to refresh files');
      }
    });
  }

  /**
   * Handles a successful request to get hubs and projects data.
   * 
   * @param {object} data The projects data
   */
  onProjectsFetched(data) {
    if (data == null)
      return;

    var hubs = data.hubs;
    if (hubs == null || hubs == undefined || hubs.length == 0)
      return;

    var defaultProject = this.getDefaultProject(data);
    this.addProjects(hubs, defaultProject);
    this.getProjectModels(defaultProject, this.addModels);
  }

  /**
   * Requests models from the server.
   * 
   * @param {object} project The project
   * @param {callback} onsuccess Handler for successful retrieval of models
   */
  getProjectModels(project, onsuccess) {
    $.ajax({
      url: '/user/getModels',
      data: {
        id: project.id,
        hubId: project.hubId,
        folderId: project.rootFolderId
      },
      success: function (data) {
        onsuccess(data);
      }
    });
  }

  /**
   * Gets the default project to use.
   * 
   * @param {object} data The hubs and projects data
   */
  getDefaultProject(data) {
    if (data == null)
      return;

    var hubs = data.hubs;
    if (hubs == null || hubs.length == 0)
      return null;

    var defaults = data.defaults;
    if (defaults.hub && defaults.project) {
      var identicalHubs = $.grep(hubs, function (hub) {
        return hub.id == defaults.hub;
      });

      if (identicalHubs.length > 0) {
        if (identicalHubs.length > 1)
          console.log('Two hubs with the same id should not exists');

        var hub = identicalHubs[0];
        var identicalProjects = $.grep(hub.projects, function (project) {
          return project.id == defaults.project;
        });

        if (identicalProjects.length > 0) {
          if (identicalProjects.length > 1)
            console.log('Two projects with the same id should not exists');
          return identicalProjects[0];
        }
      }
    }

    var hub = hubs[0];
    if (hub.projects == null || hub.projects.length == 0)
      return null;

    return hub.projects[0];
  }

  /**
   * Adds hubs and their projects to combobox.
   * 
   * @param {object} hubs The hubs
   * @param {object} defaultProject The default project
   */
  addProjects(hubs, defaultProject) {
    var self = this;
    var select = $('#projects-menu');
    select.find('option').remove();

    hubs.forEach(function (hub) {
      var optGroupId = 'opt-group-' + hub.id;
      var group = $('<optgroup data-icon="glyphicon-cloud" id="' + optGroupId + '" label="' + hub.name + '"></optgroup>');

      if (hub.projects.length == 0) {
        group.attr('disabled', true);
        $('<option data-icon="glyphicon-info-sign" />').html('No projects').appendTo(group);
      } else {
        group.attr('disabled', false);
        hub.projects.forEach(function (project) {
          self.projects[project.id] = {
            id: project.id,
            name: project.name,
            rootFolderId: project.rootFolderId,
            hubId: hub.id
          };

          $('<option data-icon="glyphicon-list-alt" />').attr('value', project.id).html(project.name).appendTo(group);
        });
      }

      group.appendTo(select);
    });

    select.selectpicker('refresh');
    select.selectpicker('val', defaultProject.id);
  }

  /**
   * Adds models to combobox.
   * 
   * @param {object} data The model data
   */
  addModels(data) {
    var select = $('#models-menu');
    select.find('option').remove();

    if (data == null)
      return;

    var models = data.models;
    if (models == null || models.length == 0) {
      select.attr('disabled', true);
    } else {
      select.attr('disabled', false);
      models.forEach(function (model) {
        $('<option data-icon="glyphicon-file" />').attr('value', model.id).html(model.attributes.name).appendTo(select);
      });
    }

    // Refresh the models combobox  
    select.selectpicker('refresh');

    var defaults = data.defaults;
    if (defaults && defaults.model) {
      select.selectpicker('val', defaults.model);
      select.change();
    }
  }

  /**
   * Requests an A360 model translation (to SVF file) and launches the viewer for the svf file.
   * 
   * @param {string} versionId The version id of the model
   * @param {string} fileName The file name of the model
   */
  translateFile(versionId, fileName) {
    var options = {
      versionId: versionId
    };
    this.isFileSupported(fileName, this.launchFile.bind(this), options);
  }

  /**
   * Wait until the svf file is ready to be viewed, then launch the viewer.
   * 
   * @param {string} urn The URN of the model
   * @param {string} versionId The version id of the model
   */
  wait(urn, versionId, format, onSuccess) {
    setTimeout(function () {
      $.ajax({
        url: '/forge/isReadyToShow',
        contentType: 'application/json',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
          format: format,
          urn: urn,
          versionId: versionId
        }),
        success: function (data) {
          onSuccess(data, versionId);
        },
        error: Common.onError,
      });
    }, 5000);
  }

  /**
   * Checks if a file type is supported.
   * 
   * @param {string} fileName The file name
   * @param {callback} callback The callback handler
   * @param {object} options Options for callback
   */
  isFileSupported(fileName, callback, options) {
    var extension = (this.re.exec(fileName)[1]).toLowerCase();
    $.ajax({
      url: '/forge/md/viewerFormats',
      contentType: 'application/json',
      type: 'GET',
      dataType: 'json',
      success: function (supportedFormats) {
        // for a zip we need to define the rootFilename, need extra work (WIP)
        // let's remove it from the supported formats, for now
        supportedFormats.splice(supportedFormats.indexOf('zip'), 1);
        var isSupported = (jQuery.inArray(extension, supportedFormats) >= 0);
        callback(fileName, isSupported, options);
      },
      error: Common.onError,
    });
  }

  /**
   * Launch a file.
   * 
   * @param {string} fileName The file name
   * @param {bool} isSupported If the file type is supported or not
   * @param {object} options Options for this method
   */
  launchFile(fileName, isSupported, options) {
    var self = this;
    if (!isSupported) {
      Common.notify('File "' + fileName + '" cannot be viewed, format not supported.', 'warn');
      return;
    }

    var versionId = options.versionId;
    Common.notify('Preparing to view "' + fileName + '", please wait...', 'info');

    $.ajax({
      url: '/forge/sendToTranslation',
      contentType: 'application/json',
      type: 'POST',
      dataType: 'json',
      data: JSON.stringify({
        versionId: versionId,
        fileName: fileName
      }),
      success: function (data) {
        Common.notify(data.message + (data.readyToShow ? ' Launching viewer.' : ''), data.status);
        if (data.readyToShow) {
          _viewer.launch('forge-viewer', data.urn); // Ready to show! Launch viewer
        } else {
          if (data.status != undefined && data.status == 'error') return;
          self.wait(data.urn, versionId, 'svf', self.launchSVFModel.bind(self)); // Not ready to show. Wait 5 seconds and try again.
        }
      },
      error: Common.onError,
    });
  }

  /**
   * Launch an SVF model in the viewer.
   * 
   * @param {object} data The response from server
   */
  launchSVFModel(data, versionId) {
    if (data.readyToShow) {
      Common.notify('Launching viewer', 'success');
      _viewer.launch('forge-viewer', data.urn);
    } else {
      Common.notify(data.message, data.status);
      if (data.status != undefined && data.status == 'error') return;
      this.wait(data.urn, versionId, 'svf', launchSVFModel);
    }
  }
}

module.exports = DataManagement;