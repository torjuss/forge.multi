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
 * 2-legged authentication tokens.
 * 
 * Template: https://github.com/Autodesk-Forge/model.derivative-nodejs-box.viewer/blob/master/server/token.js
 */

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// file handling
var fileSystem = require('fs');
var path = require('path');

// config information, such as client ID and secret
var directory = path.basename(__dirname);
var exists = fileSystem.existsSync(path.resolve(directory, 'config.js'));
var config = (exists ? require('./config') :
  (console.log('No config.js file present, assuming using FORGE_CLIENT_ID & FORGE_CLIENT_SECRET system variables.'), require('./config_')));

function Token2Legged(session) {
  this._session = session;
}

Token2Legged.prototype.getTokenInternal2Legged = function (callback) {
  var s = this._session;
  if (this._session.tokeninternal2Legged == null) {
    var ForgeOauth2 = require('forge-oauth2');
    var apiInstance = new ForgeOauth2.TwoLeggedApi();
    var clientId = config.credentials.client_id;
    var clientSecret = config.credentials.client_secret;
    var grantType = "client_credentials";
    var opts = {'scope': config.scopeInternal};
    apiInstance.authenticate(clientId, clientSecret, grantType, opts).then(function(data){
      s.tokeninternal2Legged = data.access_token;
      callback(s.tokeninternal2Legged);
    });
  }
  else {
    callback(this._session.tokeninternal2Legged);
  }
};

Token2Legged.prototype.getTokenPublic2Legged = function (callback) {
  var s = this._session;
  if (this._session.tokenpublic2Legged == null) {
    var ForgeOauth2 = require('forge-oauth2');
    var apiInstance = new ForgeOauth2.TwoLeggedApi();
    var clientId = config.credentials.client_id;
    var clientSecret = config.credentials.client_secret;
    var grantType = "client_credentials";
    var opts = {'scope': config.scopePublic};
    apiInstance.authenticate(clientId, clientSecret, grantType, opts).then(function(data){
      s.tokenpublic2Legged = data.access_token;
      callback(s.tokenpublic2Legged);
    });
  }
  else {
    callback(this._session.tokenpublic2Legged);
  }
};

module.exports = Token2Legged;
