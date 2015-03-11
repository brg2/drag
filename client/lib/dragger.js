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
      Session.set('dragging', '')
      return
    },

    update: function(e) {
      update(e)
      if(element) Session.set('dragging', 'dragging')
      return
    }
  }   

  /* Private Variables */
  var element, pos, opos, diff, rsize, cleared, stopCallbacks = [], lastParentId, newParentId, newchild

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
      left: element.offset().left - (isParentBody ? 0 : (newparent.offset().left + parseFloat(newparent.css('borderLeft')) + parseFloat(newparent.css('marginLeft')) + parseFloat(element.css('marginLeft')))), 
      top: element.offset().top - (isParentBody ? 0 : (newparent.offset().top + parseFloat(newparent.css('borderTop')) + parseFloat(newparent.css('marginTop')) + parseFloat(element.css('marginTop'))))
    })
    
  }
  //Called after the user releases the mouse button from dragging an element.
  function callStopCallbacks(element, lastParentId, newParentId) {
    for(var i in stopCallbacks) {
      setTimeout(stopCallbacks[i](element, lastParentId, newParentId));
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
  function gebp(x, y, callback) {
    $('#overlay').hide()
    if((found = $(document.elementFromPoint(x - $(document).scrollLeft(), y - $(document).scrollTop()))).length) callback(found)
    else setTimeout(callback)
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
    element = pos = opos = diff = rsize = cleared = lastParentId = newParentId = newchild = false
  }
  //Called when the user begins to drag an element.
  function start(e) {
    clear({skipBlur: true})
    pos = {x:e.pageX, y:e.pageY}
    if(e.shiftKey) rsize = true
    gebp(e.pageX, e.pageY, function(el) {
      if(['body','html'].indexOf((element = el)[0].tagName.toLowerCase()) != -1) {element = false; return }
      var isParentBody = false
      if(['body','html'].indexOf(el.parent()[0].tagName.toLowerCase()) != -1) isParentBody = true
      var leftbm = parseFloat(element.parent().css('borderLeft')) + parseFloat(element.parent().css('marginLeft')) + parseFloat(element.css('marginLeft')) + parseFloat($(document.body).css('marginLeft'))
      var topbm = parseFloat(element.parent().css('borderTop')) + parseFloat(element.parent().css('marginTop')) + parseFloat(element.css('marginTop')) + parseFloat($(document.body).css('marginTop'))
      opos = {x:(isParentBody ? element.offset().left : parseFloat(element.css('left'))),// - (isParentBody ? 0 : element.parent().offset().left),// - leftbm)), 
        y: (isParentBody ? element.offset().top : parseFloat(element.css('top'))),// - (isParentBody ? 0 : (element.parent().offset().top)),// - topbm)), 
        h: element.height(), 
        w: element.width()}
      update(e)
      Session.set('element', element.attr(AH_ID))
    });
  }
  //Called after the user releases the mouse button from dragging an element.
  function stop(e) {
    if(!element) return
    if(rsize) {
      callStopCallbacks(element, lastParentId, newParentId)
      init()
      return
    }
    var curviz = element.css('visibility')
    element.css('visibility', 'hidden')
    gebp(e.pageX, e.pageY, function(el) {
      element.css('visibility', curviz)
      //If found an element and not resizing and the two elements don't have the same id
      if(el && !rsize && el.attr(AH_ID) != element.attr(AH_ID)) {
        //Reparent this element to el
        attachTo(el)
      }
      //Call the stop callbacks
      callStopCallbacks((newchild ? newchild : element), lastParentId, newParentId)
      //Reinitialize
      init()
    })
  }
  //Update the element css to reflect the current mouse position
  function update(e) {
    if(!element) return
    clear()
    diff = {x: e.pageX - pos.x, y: e.pageY - pos.y}
    if(rsize) {
      element.css({ top: opos.y, left: opos.x, height: opos.h + diff.y, width: opos.w + diff.x })
    } else {
      element.css({ top: opos.y + diff.y, left: opos.x + diff.x, height: opos.h, width: opos.w })
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
