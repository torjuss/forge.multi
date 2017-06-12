/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

/**
 * Template: https://github.com/Autodesk-Forge/data.management-nodejs-integration.box/blob/master/server/data.management.tree.js
 */

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');
// user settings in session
var user = require('./user');

// web framework
var express = require('express');
var router = express.Router();

// forge
var ForgeDataManagement = require('forge-data-management');

//TODO: Torjus: Skal vi bruke POST-requests og unngå å lagre projects? Gå gjennom sikkerheten i appen generelt.
/**
 * Fetches the model (versions) for a given project.
 */
router.get('/user/getModels', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  // Configure OAuth2 access token for authorization: oauth2_access_code
  var defaultClient = ForgeDataManagement.ApiClient.instance;
  var oauth = defaultClient.authentications['oauth2_access_code'];
  oauth.accessToken = tokenSession.getTokenInternal();

  var id = req.query.id;
  var hubId = req.query.hubId;
  var folderId = req.query.folderId;
  if (id == null || id == undefined || id == '')
    res.status(500).end('[]');

  var userSession = new user(req.session);
  userSession.setDefaultProject(hubId, id);

  var models = [];
  var currentFolder = {};
  var currentFiles = {};
  var foldersApi = new ForgeDataManagement.FoldersApi();
  foldersApi.getFolderContents(id, folderId, null, onFolderContentsFetched);

  function onFolderContentsFetched(error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      if (data != null && data.included != null && data.included.length > 0) {
        var items = data.included;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          models.push({
            id: item.id,
            attributes: item.attributes
          });
        }
      }

      res.status(200).json({
        models,
        defaults: userSession.getDefaultSettings()
      });
    }
  }
});

/**
 * Fetches all the hubs and projects for a given user.
 */
router.get('/user/getMyFiles', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var userSession = new user(req.session);

  // Configure OAuth2 access token for authorization: oauth2_access_code
  var defaultClient = ForgeDataManagement.ApiClient.instance;
  var oauth = defaultClient.authentications['oauth2_access_code'];
  oauth.accessToken = tokenSession.getTokenInternal();

  var hubs = [];
  var currentHub = {};
  var currentProjects = [];
  var hubsApi = new ForgeDataManagement.HubsApi();
  hubsApi.getHubs(null, onHubsFetched);

  function onHubsFetched(error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      if (data == null || data.data == null || data.data.length == 0) {
        res.status(200).json(hubs);
        return;
      }

      var fetchedHubs = data.data;
      addHub(fetchedHubs);
    }
  }

  function addHub(fetchedHubs) {
    currentHub = fetchedHubs.pop();
    currentProjects = [];
    hubs.push({
      id: currentHub.id,
      name: currentHub.attributes.name,
      projects: currentProjects
    });

    hubsApi.getHubProjects(currentHub.id, null, onProjectsFetched);

    function onProjectsFetched(error, data, response) {
      if (error) {
        res.status(500).end(error);
      } else {
        if (data == null || data.data == null || data.data.length == 0)
          return [];

        var fetchedProjects = data.data;
        for (var i = 0; i < fetchedProjects.length; i++) {
          var proj = fetchedProjects[i];
          currentProjects.push({
            id: proj.id,
            name: proj.attributes.name,
            rootFolderId: proj.relationships.rootFolder.data.id,
            hubId: proj.relationships.hub.data.id
          });
        }

        if (fetchedHubs.length > 0) {
          addHub(fetchedHubs);
        } else {
          res.status(200).json({
            hubs,
            defaults: userSession.getDefaultSettings()
          });
        }
      }
    }
  }
});

module.exports = router;