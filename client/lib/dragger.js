Dragger = (function() {    

  var mainobj = {
    //Assign a callback after dragging stops
    onstop: function(stopCallback) {
      if(!stopCallback) return
      if(stopCallback.constructor !== Array) stopCallback = [stopCallback]
      $.merge(stopCallbacks, stopCallback)
    },

    //Clear text selection and blur out of any fields
    clear: clear,

    //Convert css string to json object
    css2obj: function(strCSS, toArray) {
      if(!strCSS) return
      if(toArray === undefined) toArray = false
      var arrStrCSS = strCSS.split(';'), arrJSON = toArray ? [] : {}, nextStrCSS = '', arrParts = [],
        strCSSName = '', strCSSValue = '', found = false
      arrStrCSS.sort()
      for(var i in arrStrCSS) {
        nextStrCSS = $.trim(arrStrCSS[i])
        if(!nextStrCSS) continue
        arrParts = getStyleValParts(nextStrCSS)
        strCSSName = $.trim(arrParts[0]).toLowerCase()
        strCSSValue = $.trim(arrParts[1])
        found = false
        for(var j in arrJSON) {
          if((!toArray && (j == strCSSName && arrJSON[j] == strCSSValue)) || 
            (toArray && (arrJSON[j].name == strCSSName && arrJSON[j].value == strCSSValue))) {
            found = true
            break
          } 
        }
        if(!found && !toArray) arrJSON[strCSSName] = strCSSValue
        if(!found && toArray) arrJSON.push({name: strCSSName, value: strCSSValue})
      }
      return arrJSON
    },

    obj2css: function(obj) {
      var strStyles = ''
      _.each(obj, function(value, name) {
        strStyles += name + ": " + value + '; '
      })
      return strStyles
    },

    start: function(e) {
      start(e)
      return
    },

    stop: function(e) {
      stop(e)
      return
    },

    update: function(e) {
      update(e)
      return
    }
  }   

  /* Private Variables */
  var updel, element, dbel, pos, opos, dragging, diff, rsize, cleared, stopCallbacks = [], lastParentId, newParentId, newchild

  /* Private Functions */
  //Attach the currently dragged element to a new parent element.
  function attachTo(newparent) {
    if(newparent[0].tagName.toLowerCase() == 'html') newparent = $(document.body)
    var oldparent = element.parent()
    lastParentId = oldparent.attr(AH_ID)
    newParentId = newparent.attr(AH_ID)
    //Avoid attaching to the same parent and attaching to a non-absolute element
    if(newparent.is(oldparent) || newparent.css('position').toLowerCase() == 'relative') return
    var isParentBody = false
    if(['body','html'].indexOf(newparent[0].tagName.toLowerCase()) != -1) isParentBody = true
    newchild = element.clone()
    newchild.css({
      left: updel.left = (element.offset().left - (isParentBody ? 0 : (newparent.offset().left +
        getNumber(newparent.css('borderLeft')) +
        getNumber(newparent.css('marginLeft')) +
        getNumber(element.css('marginLeft')))) + 'px'),
      top: updel.top = (element.offset().top - (isParentBody ? 0 : (newparent.offset().top +
        getNumber(newparent.css('borderTop')) +
        getNumber(newparent.css('marginTop')) +
        getNumber(element.css('marginTop')))) + 'px')
    })
    
  }
  //Called after the user releases the mouse button from dragging an element.
  function callStopCallbacks(dbelement, lastParentId, newParentId) {
    for(var i in stopCallbacks) {
      setTimeout(stopCallbacks[i]({_id: dbelement._id, style: updel}, lastParentId, newParentId));
    }
  }
  //Clears any text selections that might have occurred while clicking on an element to drag.
  function clear(options) {
    if(options === undefined) options = {}
    //Clear text selection
    try{document.selection.empty();}catch(e){}
    try{window.getSelection().removeAllRanges()}catch(e){}
    if(!options.skipBlur) setTimeout(function(){try{document.activeElement.blur()}catch(e){}})
  }
  // gebp - Get Element By Position.
  function gebp(event, callback) {
    $('#overlay').hide()
    if((found = $(document.elementFromPoint(event.pageX - $(document).scrollLeft(),
      event.pageY - $(document).scrollTop()))).length) callback(event, found)
    else setTimeout(function(){callback(event, false)})
    $('#overlay').show()
  }
  //Split a style segment into object
  function getStyleValParts(strStyleVal) {
    var styleparts = $.trim(strStyleVal).split(':');
    if(styleparts.length > 2) {
      for(var i = 2; i < styleparts.length; i++) {
        styleparts[1] += ': ' + $.trim(styleparts[i]);
      }
    }
    styleparts.splice(2);
    return styleparts;
  }
  //Reset the variables to initial values.
  function init() {
    Session.set('dragging', false)
    updel = element = dragging = pos = opos = diff = rsize = cleared = lastParentId = newParentId = newchild = false
  }
  //Extract a number from a string
  function getNumber(strValue) {
    try{return parseFloat(strValue.match(/[\-\d.]+/)[0])}catch(e){return 0}
  }
  //Called when the user begins to drag an element.
  function start(e) {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    clear()
    pos = {x:e.pageX, y:e.pageY}
    if(e.shiftKey) rsize = true
    gebp(e, function(e, el) {
      element = el
      try{while( !element.attr(AH_ID) && element[0].tagName.toLowerCase() != 'body')
        element = element.parent()}catch(e){element = false; return}
      if(element[0].tagName.toLowerCase() == 'body') {element = false; return }
      dbel = getElementPath(element.attr(AH_ID)).element
      updel = {}
      var isParentBody = false
      if(['body','html'].indexOf(el.parent()[0].tagName.toLowerCase()) != -1)
        isParentBody = true
      var leftbm = getNumber(element.parent().css('borderLeft')) +
        getNumber(element.parent().css('marginLeft')) +
        getNumber(element.css('marginLeft')) +
        getNumber($(document.body).css('marginLeft'))
      var topbm = getNumber(element.parent().css('borderTop')) +
        getNumber(element.parent().css('marginTop')) +
        getNumber(element.css('marginTop')) +
        getNumber($(document.body).css('marginTop'))
      opos = {x:(isParentBody ? element.offset().left : (getNumber(element.css('left')) || 0)),
        y: (isParentBody ? element.offset().top : (getNumber(element.css('top')) || 0)),
        h: element.height(),
        w: element.width()}
      var elid = element.attr(AH_ID) || element.parent().attr(AH_ID)
      if(Session.equals('element', elid)) return
      setTimeout(function() {
        Session.set('element', elid)
      })
    });
  }
  //Called after the user releases the mouse button from dragging an element.
  function stop(e) {
    if(!element || Session.equals('dragging',false)) return init()
    if(rsize) {
      callStopCallbacks(dbel, lastParentId, newParentId)
      init()
      return
    }
    var curviz = element.css('visibility')
    element.css('visibility', 'hidden')
    gebp(e, function(e, el) {
      element.css('visibility', curviz)
      //If found an element and not resizing and the two elements don't have the same id
      if(e.altKey && el && !rsize && el.attr(AH_ID) != element.attr(AH_ID)) {
        //Reparent this element to el
        attachTo(el)
      }
      //Call the stop callbacks
      callStopCallbacks(dbel, lastParentId, newParentId)
      //Reinitialize
      init()
    })
  }
  //Update the element css to reflect the current mouse position
  function update(e) {
    if(!element) return
    clear()
    Session.set('dragging', true)
    diff = {x: e.pageX - pos.x, y: e.pageY - pos.y}
    var check = function(what) { return dbel.style.hasOwnProperty(what) &&
      dbel.style[what].indexOf('%') < 0 &&
      dbel.style[what].indexOf('important') < 0 &&
      dbel.style[what].indexOf('auto') < 0 }

    if(rsize) {
      if (check('width'))
        element.css('width', updel.width = ((opos.w + diff.x) || 0) + 'px')
      if (check('height'))
        element.css('height', updel.height = ((opos.h + diff.y) || 0) + 'px')
    } else {
      if (check('left'))
        element.css('left', updel.left = ((opos.x + diff.x) || 0) + 'px')
      if (check('top'))
        element.css('top', updel.top = ((opos.y + diff.y) || 0) + 'px')
    }
  }
  /* End Private Functions */

  /* Begin Init */
  init()
  /* End Init */

  /* Object */
  return mainobj
  /* End Object */
})()
