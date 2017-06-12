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
 * Template: https://github.com/Autodesk-Forge/model.derivative-nodejs-box.viewer/blob/master/server/model.derivative.box.integration.js
 */

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');
// user settings in session
var user = require('./user');

var express = require('express');
var router = express.Router();
var fileSystem = require('fs');
var path = require('path');

// config information, such as client ID and secret
var directory = path.basename(__dirname);
var exists = fileSystem.existsSync(path.resolve(directory, 'config.js'));
var config = (exists ? require('./config') :
  (console.log('No config.js file present, assuming using FORGE_CLIENT_ID & FORGE_CLIENT_SECRET system variables.'), require('./config_')));

// forge
var ForgeModelDerivative = require('forge-model-derivative');

/**
 * Fetches an A360 model version, translates the model to SVF and returns the URN for the SVF (viewable) model.
 * https://github.com/autodesk-forge/forge.model.derivative-js/blob/master/docs/DerivativesApi.md#translate
 */
router.post('/forge/sendToTranslation', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var mdClient = ForgeModelDerivative.ApiClient.instance;
  var mdOAuth = mdClient.authentications['oauth2_access_code'];
  mdOAuth.accessToken = tokenSession.getTokenInternal();

  var versionUrn = req.body.versionId.toBase64();
  var derivativesApi = new ForgeModelDerivative.DerivativesApi();
  derivativesApi.translate(createTranslateJob(versionUrn, 'svf'), null, function (error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      // Send the URN to the client and inform that translating is in progress.
      res.status(200).json({
        status: 'info',
        readyToShow: false,
        message: 'Translation to SVF in progress, please wait...',
        urn: versionUrn,
      });
    }
  });
});

/**
 * Fetches an A360 model version, translates the model to IFC and returns the IFC data.
 */
router.post('/forge/sendToTranslationIFC', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var mdClient = ForgeModelDerivative.ApiClient.instance;
  var mdOAuth = mdClient.authentications['oauth2_access_code'];
  mdOAuth.accessToken = tokenSession.getTokenInternal();

  var versionUrn = req.body.versionId.toBase64();
  var derivativesApi = new ForgeModelDerivative.DerivativesApi();
  derivativesApi.translate(createTranslateJob(versionUrn, 'ifc'), null, function (error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      // Send the URN to the client and inform that translating is in progress.
      res.status(200).json({
        status: 'info',
        readyToShow: false,
        message: 'Translation to IFC in progress, please wait...',
        urn: versionUrn,
      });
    }
  });
});

router.post('/forge/downloadDerivative', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var userSession = new user(req.session);
  var mdClient = ForgeModelDerivative.ApiClient.instance;
  var mdOAuthAccessCode = mdClient.authentications['oauth2_access_code'];
  mdOAuthAccessCode.accessToken = tokenSession.getTokenInternal();

  var urn = req.body.urn;
  var derivativeUrn = req.body.fileUrn;
  var derivativesApi = new ForgeModelDerivative.DerivativesApi();
  derivativesApi.getDerivativeManifest(urn, derivativeUrn, {}, function (error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      fileSystem.writeFile('model.ifc', data, (err) => {
        if (err)
          console.log('Failed to write file');
      });
      res.status(200).end();
    }
  });
});

/**
 * Checks if the document is ready to be shown in the viewer, and
 * if not ready it reports the translation progress of the document.
 */
router.post('/forge/isReadyToShow', function (req, res) {
  var tokenSession = new token(req.session);
  if (!tokenSession.isAuthorized()) {
    res.status(401).end('Please login first');
    return;
  }

  var userSession = new user(req.session);
  var mdClient = ForgeModelDerivative.ApiClient.instance;
  var mdOAuthAccessCode = mdClient.authentications['oauth2_access_code'];
  mdOAuthAccessCode.accessToken = tokenSession.getTokenInternal();

  var format = req.body.format;
  var versionId = req.body.versionId;
  var versionUrn = req.body.urn;
  var derivativesApi = new ForgeModelDerivative.DerivativesApi();
  derivativesApi.getManifest(versionUrn, null, function (error, data, response) {
    if (error) {
      res.status(500).end(error);
    } else {
      var returnValue = {};
      var manifest = data;
      var status = '';
      var message = 'Translation ';
      switch (manifest.status) {
        case 'success':
          message += 'completed.';
          status = manifest.status;
          if (format == 'svf')
            returnValue.rootGuid = getRootGuid(manifest);
          break;
        case 'pending':
          message += 'is pending...';
          status = 'info';
          break;
        case 'timeout':
          message += 'timed out...';
          status = 'warn';
          break;
        case 'failed':
          message += manifest.status + '.';
          status = 'error';
          break;
        case 'inprogress':
        default:
          message += 'in progress: ' + manifest.progress;
          status = 'info';
          break;
      }

      var ready = status == 'success';
      if (ready)
        userSession.setDefaultModel(versionId);

      returnValue.status = status;
      returnValue.readyToShow = ready;
      returnValue.message = message;
      returnValue.urn = versionUrn;

      if (format == 'ifc')
        returnValue.fileUrn = getDerivativeUrn(manifest);

      res.status(200).json(returnValue);
    }
  });
});


/**
 * Gets the URN of a derivative (model for download, e.g. IFC or OBJ).
 * 
 * @param {object} manifest The manifest of the file.
 * @returns {string} The URN of the derivative
 */
function getDerivativeUrn(manifest) {
  for (var i = 0; i < manifest.derivatives.length; i++) {
    var derivative = manifest.derivatives[i];
    if (!derivative.outputType || derivative.outputType != 'ifc')
      continue;

    return derivative.children[0].urn;
  }

  return '';
}

/**
 * Gets the guid for the root object in the first model of a file.
 * 
 * @param {object} manifest The manifest for the file
 * @returns {string} The guid of the root object
 */
function getRootGuid(manifest) {
  var firstModel = manifest.derivatives[0].children[0];
  for (var i = 0; i < firstModel.children.length; i++) {
    var child = firstModel.children[i];
    if (child.role == 'graphics' && child.mime == 'application/autodesk-svf') {
      return child.guid;
    }
  }

  return '';
}

/**
 * Converts a URN string to a base 64 representation.
 */
String.prototype.toBase64 = function () {
  return new Buffer(this).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Creates a translation job input that Forge will process to make a viewable svf file.
 */
function createTranslateJob(ossUrn, format) {
  var postJob = {
    input: {
      urn: ossUrn
    },
    output: {
      formats: [{
        type: format,
        views: ['2d', '3d']
      }]
    }
  };

  return postJob;
}

// regex to extract file extension
var re = /(?:\.([^.]+))?$/;

/**
 * Get the file extension of the document.
 */
function getMineType(fileName) {
  var extension = re.exec(fileName)[1];
  var types = {
    'png': 'application/image',
    'jpg': 'application/image',
    'txt': 'application/txt',
    'ipt': 'application/vnd.autodesk.inventor.part',
    'iam': 'application/vnd.autodesk.inventor.assembly',
    'dwf': 'application/vnd.autodesk.autocad.dwf',
    'dwg': 'application/vnd.autodesk.autocad.dwg',
    'f3d': 'application/vnd.autodesk.fusion360',
    'f2d': 'application/vnd.autodesk.fusiondoc',
    'rvt': 'application/vnd.autodesk.revit'
  };
  return types[extension] != null ? types[extension] : 'application/' + extension;
}

module.exports = router;