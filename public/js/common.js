let _palette = ["#2E6B2E", "#3D8F3D", "#4DB34D", "#2F713D", "#3E9550", "#50B665", "#31764E", "#409B65", "#54B97E", "#327C70", "#41A07C", "#58BC96", "#338274", "#42A695", "#5CBFAE", "#348588", "#43A9AD", "#60BEC2", "#36788E", "#4398F3", "#65ADC5", "#376A94", "#4485B9", "#699DC7", "#38599A", "#4870BD", "#6D8DCA", "#3947A0", "#4C5CC0", "#717EFD", "#5850C2", "#7C76D0", "#5A3AAC", "#7354C5", "#927AD2", "#753BB2", "#8E58C8", "#A87FD5", "#923CBF", "#A95DCB", "#BD83D7", "#B23CBF", "#C261CD", "#D188D9", "#C43FB6", "#D066C5", "#DC8DD4", "#C7439E", "#D26ABF", "#DE91C6", "#C94786", "#D56FA0", "#E096BA", "#CC4C6F", "#D7748F", "#E29BAF", "#CE5059", "#D9787F", "#E5A0AF", "#D16655", "#DC8A7D", "#E7AEA5", "#D3835A", "#DEA282", "#E9C0AA", "#D6A05E", "#E0B887", "#EAD0AF", "#D8BC6F", "#E2CD8C", "#ECDFB5", "#DAD668", "#E4E191", "#EEECBA", "#C9DC6D", "#D8E696", "#E7F0BF", "#B5DE72", "#CBE8FB", "#E0F1C4", "#A2E077", "#BFEAA0", "#DBF3CA", "#91E27C", "#B4EBA6", "#D7F5CF", "#81E481", "#ABEDAB", "#D5F6D5", "#327C60", "#4398B3", "#717ECD", "#923CB9", "#D26AB2", "#E5A0A5", "#D8BC63", "#CBE89B", "#CB08BB", "#DF6A22", "#EFA035", ];

let _notifyOptions = {
  clickToHide: true,
  autoHide: true,
  autoHideDelay: 3000,
  arrowShow: true,
  arrowSize: 5,
  position: 'bottom left',
  style: 'bootstrap',
  className: 'info',
  showAnimation: 'slideDown',
  showDuration: 400,
  hideAnimation: 'slideUp',
  hideDuration: 200,
};

class Common {
  constructor() {

  };

  static getPalette() {
    return _palette;
  }

  static getOptions() {
    return _notifyOptions;
  }

  static getEventTarget(event) {
    event = event || window.event;
    return event.target || event.srcElement;
  }

  static onError(error) {
    var isString = typeof error === 'string' || error instanceof String;
    if (!isString) {
      if (error.responseText !== undefined)
        error = error.responseText;
      else if (error.message !== undefined)
        error = error.message;
      else
        error = 'Something went wrong!';
    }

    notify(error, 'error');
    console.error(error);
  }

  static notify(message, type) {
    $.notify(message, Common.getNotifyOptions(type));
  }

  static getNotifyOptions(className) {
    var options = Common.getOptions()
    options.className = className;
    return options;
  }

  /**
   * Function for changing visibility of a DOM element and changing the icon of the button that controls the visibility of the element.
   * 
   * @param {any} $button The button element
   * @param {any} $target The DOM element to change visibility for
   * @param {any} visibleClass The CSS class representing the icon to display when $target is visible
   * @param {any} hiddenClass The CSS class representing the icon to display when $target is hidden
   */
  static toggleVisibilityAndIcon($button, $target, visibleClass, hiddenClass) {
    var visible = $target.is(':visible');
    if (visible) {
      $target.hide();
    } else {
      $target.css('display', 'flex');
    }

    Common.switchButtonIcon($button, visible, visibleClass, hiddenClass);
  }

  /**
   * Switch the icon of a button element.
   * 
   * @param {any} $button The button element
   * @param {any} isVisible Whether the visibleClass or hiddenClass should be used
   * @param {any} visibleClass The class representing a "visible" icon
   * @param {any} hiddenClass The class representing a "hidden" icon
   */
  static switchButtonIcon($button, isVisible, visibleClass, hiddenClass) {
    var classToAdd = isVisible ? hiddenClass : visibleClass;
    var classToRemove = isVisible ? visibleClass : hiddenClass;
    if ($button.children('i').length > 0)
      $button = $button.children('i');
    $button.removeClass(classToRemove).addClass(classToAdd);
  }

  static addSelectOptions($select, values, current = undefined) {
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      var option = $('<option />', {
        value: value,
        text: value == '' ? '-' : value,
      });

      if (current == value)
        option.attr('selected', 'selected');

      $select.append(option);
    }
  }

  /**
   * Converts a timestamp (milliseconds) into local time.
   * 
   * @param {int} timeStamp milliseconds since 1970
   * @returns {string} String representation of local time
   */
  static getLocalTime(timeStamp) {
    var date = new Date(timeStamp);
    return date.toLocaleString();
  }

  static resizeTable($table, $container) {
    if ($table === undefined || $container === undefined)
      return;

    var tableWidth = $table.css('width');
    var containerWidth = $container.css('width');
    var minWidth = tableWidth < containerWidth ? '100%' : tableWidth;
    $container.find('.bootstrap-table').css('min-width', minWidth);
  }

  /**
   * Gets a three.js color object
   * 
   * @param {int} index an integer
   * @returns {object} a three.js color object
   */
  static getColorFromIndex(index) {
    index = index % 100;
    var row = index % 10;
    var column = Math.floor(index / 10);
    var ind = 10 * row + column;
    var c = new THREE.Color(getPalette()[ind]);
    var color = new THREE.Vector4(c.r, c.g, c.b, 0.8);

    return color;
  }
}

module.exports = Common;