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
 * 3-legged authentication tokens.
 * 
 * Template: https://github.com/Autodesk-Forge/data.management-nodejs-integration.box/blob/master/server/token.js
 */

'use strict'; // http://www.w3schools.com/js/js_strict.asp

function Token(session) {
  this._session = session;
}

Token.prototype.getTokenInternal = function () {
  return this._session.tokeninternal;
};

Token.prototype.setTokenInternal = function (token) {
  this._session.tokeninternal = token;
};

Token.prototype.getTokenPublic = function () {
  return this._session.tokenpublic;
};

Token.prototype.setTokenPublic = function (token) {
  this._session.tokenpublic = token;
};

Token.prototype.isAuthorized = function () {
  return (this._session.tokenpublic != null);
};

module.exports = Token;
