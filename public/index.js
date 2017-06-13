import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-select/css/bootstrap-select.css';
import 'css/main.css';
import 'css/forge.white.toolbar.css';

import 'img/nois.svg';
import 'img/autodesk-logo.png';
import 'img/refresh.png';
import 'img/nois_32x32.ico';

import 'jquery';
import 'bluebird';
import 'bootstrap';
import 'bootstrap-select/js/bootstrap-select';
import 'moment';
import 'libs/notifyjs/notify';

var OAuth = require('./js/oauth');
var DataManagement = require('./js/forge.data.management');
var Viewer = require('./js/viewer');

$(document).ready(function () {
  var oAuth = new OAuth();
  oAuth.initiate();
  var dataM = new DataManagement();
  dataM.initiate();

  global._viewer = new Viewer();
});
