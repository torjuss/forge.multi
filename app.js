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

var https = require('https');
var fileSystem = require('fs');
var app = require('./server/server');

// https://docs.nodejitsu.com/articles/HTTP/servers/how-to-create-a-HTTPS-server/
// const options = {
// // https://www.sslshopper.com/article-most-common-openssl-commands.html
//   pfx: fileSystem.readFileSync('cert.pfx'),
//   passphrase: 'ISYcodeS1gn1ng'
//   // key: fileSystem.readFileSync('key.pem'),
//   // cert: fileSystem.readFileSync('cert.pem')
// };

// var server = https.createServer(options, app);

// server.listen(app.get('port'), function () {
var server = app.listen(app.get('port'), function () {
  var development = process.env.NODE_ENV !== 'production';
  if (development && (process.env.FORGE_CLIENT_ID == null || process.env.FORGE_CLIENT_SECRET == null))
    console.log('\nWARNING: Forge Client ID & Client Secret not defined as environment variables!\n');

  console.log('Starting at ' + (new Date()).toString());
  console.log('Server listening on port ' + server.address().port);
});