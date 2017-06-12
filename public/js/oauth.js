/**
 * Template: https://github.com/Autodesk-Forge/data.management-nodejs-integration.box/blob/master/www/js/oauth.js
 */

class OAuth {

  constructor() {
    this.userName = undefined;
  };

  initiate() {
    var currentToken = OAuth.getForgeToken();
    if (currentToken === '') {
      this.handleForgeLoggedOut();
    } else {
      this.getForgeUserProfile();
    }
  }

  getUserName() {
    return this.userName;
  }

  /**
   * Gets the 3-legged authentication token.
   * 3-legged authentication is needed when accessing user's data through the data management API (A360).
   * 
   * @returns The 3-legged authentication token
   */
  static getForgeToken() {
    var token = '';
    $.ajax({
      url: '/user/token',
      success: function (data) {
        token = data;
      },
      async: false // this request must be synchronous for the Forge viewer.
    });

    return token;
  }

  /**
   * Hides controls that requires login.
   */
  handleForgeLoggedOut() {
    this.userName = '';
    $('#projects-and-models').hide();
    $('#main-panel').hide();
    $('#sign-in-btn').attr('data-toggle', 'tooltip').click(this.forgeSignIn);
  }

  /**
   * Shows user information and controls that require login.
   */
  handleForgeLoggedIn(profile) {
    this.userName = profile.name;
    $('#sign-in-profile-image').attr('src', profile.picture);
    $('#sign-in-btn-text').text(profile.name);
    $('#sign-in-btn').attr('title', 'Signed in as ' + profile.name).attr('data-toggle', 'dropdown');
    $('#sign-out-btn').click(this.forgeLogoff);
    $('#projects-and-models').show();
    $('#main-panel').show();
  }

  /**
   * Signs in to the A360 account.
   */
  forgeSignIn() {
    $.ajax({
      url: '/user/authenticate',
      success: function (rootUrl) {
        location.href = rootUrl;
      }
    });
  }

  /**
   * Logs off the A360 account.
   */
  forgeLogoff() {
    $.ajax({
      url: '/user/logoff',
      success: function (oauthUrl) {
        location.href = oauthUrl;
      }
    });
  }

  /**
   * Get's the user profile details from A360.
   */
  getForgeUserProfile() {
    var forgeLoggedInHandler = this.handleForgeLoggedIn.bind(this);
    var profile = '';
    $.ajax({
      url: '/user/profile',
      success: forgeLoggedInHandler,
    });
  }
}

module.exports = OAuth;