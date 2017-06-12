'use strict';


/**
 * User settings
 * 
 * @param {any} session The current session
 */
function User(session) {
  this._session = session;

  if (!this._session.defaults)
    this._session.defaults = {};
}

User.prototype.getDefaultSettings = function () {
  return this._session.defaults;
};

User.prototype.setDefaultModel = function (model) {
  this._session.defaults.model = model;
};

User.prototype.setDefaultProject = function (hub, project) {
  this._session.defaults.hub = hub;
  this._session.defaults.project = project;
};

User.prototype.setDefaultRebarSettings = function (changeAllRebars, showAllHosts) {
  if (changeAllRebars != null)
    this._session.defaults.changeAllRebars = changeAllRebars;

  if (showAllHosts != null)
    this._session.defaults.showAllHosts = showAllHosts;
};

module.exports = User;