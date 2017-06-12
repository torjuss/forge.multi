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
 * 3-legged AOuth.
 * Template: https://github.com/Autodesk-Forge/data.management-nodejs-integration.box/blob/master/server/oauth.js
 */

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token = require('./token');

// web framework
var express = require('express');
var router = express.Router();

// forge oAuth package
var forgeOAuth2 = require('forge-oauth2');

// file handling
var fileSystem = require('fs');
var path = require('path');

// config information, such as client ID and secret
var directory = path.basename(__dirname);
var exists = fileSystem.existsSync(path.resolve(directory, 'config.js'));
var config = (exists ? require('./config') :
  (console.log('No config.js file present, assuming using FORGE_CLIENT_ID & FORGE_CLIENT_SECRET system variables.'), require('./config_')));

/**
 * Logs off the current user by destroying the session.
 */
router.get('/user/logoff', function (req, res) {
  req.session.destroy();
  res.end('/');
});

/**
 * Returns the name & picture of the user for display in the GUI.
 * The forge @me endpoint returns more information.
 */
router.get('/user/profile', function (req, res) {
  var tokenSession = new token(req.session);
  forgeOAuth2.ApiClient.instance.authentications['oauth2_access_code'].accessToken = tokenSession.getTokenInternal();
  var oa3Info = new forgeOAuth2.InformationalApi();
  oa3Info.aboutMe()
    .then(function (data) {
      var profile = {
        'name': data.firstName + ' ' + data.lastName,
        'picture': data.profileImages.sizeX20
      };
      res.status(200).json(profile);
    })
    .catch(function (error) {
      console.log(error);
    });
});

/**
 * Returns the public token of the current user.
 * The public token should have a limited scope (read-only).
 */
router.get('/user/token', function (req, res) {
  var tokenSession = new token(req.session);
  res.status(200).send(tokenSession.getTokenPublic());
});

/**
 * Returns the forge authenticate url.
 */
router.get('/user/authenticate', function (req, res) {
  // Redirect the user to this page.
  var url =
    forgeOAuth2.ApiClient.instance.basePath +
    '/authentication/v1/authorize?response_type=code' +
    '&client_id=' + config.credentials.client_id +
    '&redirect_uri=' + config.callbackURL +
    '&scope=' + config.scopeInternal;
  res.status(200).end(url);
});

/**
 * Wait for Autodesk callback (OAuth callback).
 */
//TODO: Torjus: Remove "/api" here and in the Forge app.
router.get('/api/forge/callback/oauth', function (req, res) {
  var code = req.query.code;
  var oauth3legged = new forgeOAuth2.ThreeLeggedApi();
  var tokenSession = new token(req.session);

  // first get a full scope token for internal use (server-side).
  oauth3legged.gettoken(config.credentials.client_id, config.credentials.client_secret, 'authorization_code', code, config.callbackURL)
    .then(function (data) {
      tokenSession.setTokenInternal(data.access_token);
      // console.log('Internal token (full scope): ' + tokenSession.getTokenInternal()); // debug

      // then refresh and get a limited scope token that we can send to the client.
      oauth3legged.refreshtoken(config.credentials.client_id, config.credentials.client_secret, 'refresh_token', data.refresh_token, config.scopePublic)
        .then(function (data) {
          tokenSession.setTokenPublic(data.access_token);
          // console.log('Public token (limited scope): ' + tokenSession.getTokenPublic()); // debug
          res.redirect('/');
        })
        .catch(function (err) {
          handleError(res, err.message, 'Failed to authenticate user!');
        });
    })
    .catch(function (err) {
      handleError(res, err.message, 'Failed to authenticate user!');
    });
});

module.exports = router;