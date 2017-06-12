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

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var token2Legged = require('./token2Legged');

// web framework
var express = require('express');
var router = express.Router();

// forge
var ForgeModelDerivative = require('forge-model-derivative');

/**
 * Returns a list of Forge-supported translations.
 * 
 * Template: https://github.com/Autodesk-Forge/model.derivative-nodejs-box.viewer/blob/master/server/model.derivative.js
 * API Documentation: https://github.com/autodesk-forge/forge.model.derivative-js/blob/master/docs/DerivativesApi.md#getFormats
 */
router.get('/forge/md/viewerFormats', function (req, res) {
  var tokenSession2Legged = new token2Legged(req.session);
  tokenSession2Legged.getTokenPublic2Legged(function (tokenPublic2Legged) {

    var defaultClient = ForgeModelDerivative.ApiClient.instance;
    var oauth = defaultClient.authentications['oauth2_access_code'];
    oauth.accessToken = tokenPublic2Legged;

    var derivative = new ForgeModelDerivative.DerivativesApi();
    derivative.getFormats(null).then(function (formats) {
      res.status(200).json(formats.formats.svf);
    })
  });
});

module.exports = router;