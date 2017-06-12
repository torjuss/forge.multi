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
'use strict';

/**
 * Template: https://github.com/Autodesk-Forge/model.derivative-nodejs-box.viewer/blob/master/server/server.js
 */
var bodyParser = require('body-parser');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var express = require('express');
var helmet = require('helmet');
//TODO: Torjus: We need a session store as well. Now everything is stored in the memory and wiped at web page reload. "connect-redis" is regarded as one of the fastest, but requires that we set up a server for it (or maybe we can install it in the web app directory on Azure?): https://codeforgeek.com/2015/07/using-redis-to-handle-session-in-node-js/
//Alternatives: Azure Table Storage (https://azure.microsoft.com/en-gb/services/storage/tables/) or our existing MongoDB.
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var app = express();

var development = process.env.NODE_ENV !== 'production';
var srcPath = development ? 'dev' : 'dist';

//Performance best practices: Use compression (https://www.sitepoint.com/5-easy-performance-tweaks-node-js-express/)
app.use(compression());
//TODO: Security: https://expressjs.com/en/advanced/best-practice-security.html
// TODO: Use of cookie-parser is apparently not needed for express-session any more: https://github.com/expressjs/session
//https://github.com/expressjs/session
app.use(cookieParser());
app.use(helmet());

app.set('trust proxy', 1); // Trust first proxy
//TODO: Security: Use HTTPS and encrypt session/cookie?
app.use(session({
  //TODO: Torjus: Create unique names (guids) for persistent sessions.
  name: 'forge.multi',
  secret: 'autodeskforge13579',
  cookie: {
    httpOnly: true,
    secure: !development, // Secure in production, visible in development
    // domain: 'isypeasy.azurewebsites.com',
    // path: 'foo/bar',
    maxAge: 1000 * 60 * 60 // Milliseconds before the session expires. We should increased this when we start using persistent sessions.
  },
  resave: false,
  saveUninitialized: true
}));

//TODO: Torjus: Legge til bodyParser/jsonParser her: http://stackoverflow.com/questions/19917401/error-request-entity-too-large
app.use(bodyParser.json({
  limit: '50mb',
}));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
}));

// favicon
//TODO: Add icons to images folder in dist.
app.use(favicon(__dirname + '/../public/favicon.ico'));

// prepare server routing (redirect static calls)
var basePath = path.resolve(__dirname, '../', srcPath);
var fontsPath = path.resolve(basePath, 'fonts');
var imagesPath = path.resolve(basePath, 'img');
var libsPath = path.resolve(__dirname, '../', 'libs');

app.use('/', express.static(basePath));
app.use('/libs', express.static(libsPath));
app.use('/fonts', express.static(fontsPath));
app.use('/img', express.static(imagesPath));

app.use('/bluebird', express.static(__dirname + '/../node_modules/bluebird/js/browser'));
app.use('/bootstrap', express.static(__dirname + '/../node_modules/bootstrap/dist'));
app.use('/bootstrap-select', express.static(__dirname + '/../node_modules/bootstrap-select/dist'));
app.use('/jquery', express.static(__dirname + '/../node_modules/jquery/src'));
app.use('/moment', express.static(__dirname + '/../node_modules/moment/src'));

app.set('port', process.env.PORT || 3000); // main port

// prepare our API endpoint routing
var oauth = require('./oauth');
var datamanagement = require('./data.management');
var modelderivative = require('./model.derivative');
var forge = require('./model.derivative.forge.integration');

// redirect our API calls
app.use('/', oauth);
app.use('/', datamanagement);
app.use('/', modelderivative);
app.use('/', forge);

module.exports = app;