Template.dragger_mode_element.helpers({
  //Turn the style string into iterable array
  arrayify: function(obj){
    result = []
    for (var key in obj) result.push({name:key,value:obj[key]})
    // result.sort(function(a,b){return (a.name > b.name) ? 1 : (a.name < b.name) ? -1 : 0})
    return result
  }
})

Template.dragger_mode_element.events({
  //Highlight contenteditable field on focus
  'focus [contenteditable]': function(e) {
    e.target.innerHTML = e.target.innerText
    setTimeout(function(){document.execCommand('selectAll')})
  },
  'mousedown [contenteditable] a': function(e) {
    return false
  },
  //Hack for dragging over editor fields
  'mousedown div': function(e) {
    // if(Session.get('dragging')) return false
  },
  // Handle key events in div 
  'keydown [contenteditable]': function(e) {
    var keyVal = e.which || e.keyCode
    switch(keyVal) {
      //Up - 38, Down - 40 (todo: have up/down arrows increment/decrement numeric values)
      case 38: case 40:
        var cursorIndex = getCaretPosition(e.target),
          cursorNumber, numRegex, match, strText = $(e.target).text(), index, endex, startLen, newLen, addVal, newVal
        //Search for a number near the cursor index
        numRegex = /[-\d.]+/g
        while(match = numRegex.exec(strText)) {
          index = match.index
          endex = match.index + match[0].length
          if(match.index > cursorIndex || cursorIndex > endex) continue
          cursorNumber = match[0]
          break
        }
        //Skip if a number wasn't found
        if(!cursorNumber) return
        startLen = cursorNumber.toString().length
        //Increment by 10 if shift key is down, 0.1 if it's the control key
        addVal = e.shiftKey ? 10 : e.ctrlKey ? 0.1 : 1
        //Decrement if the down arrow was used
        addVal = keyVal == 40 ? (0 - addVal) : addVal
        //Add the two values
        newVal = parseFloat(cursorNumber) + addVal
        //Change the cursor index to reflect whether the new value is one character more or less
        if((newLen = newVal.toString().length) < startLen) cursorIndex--
        else if (newLen > startLen) cursorIndex++
        //Create the full value string
        newVal = strText.slice(0, index) + newVal + strText.slice(endex)
        //Update the element style
        $('[_id=' + Session.get('element') + ']').css(this.name, newVal)
        //Set the content as the style string
        $(e.target).text(newVal)

        //Move the cursor back where we were
        var textNode = e.target.firstChild
        var range = document.createRange();
        range.setStart(textNode, cursorIndex);
        range.setEnd(textNode, cursorIndex);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        return false
      // Enter - 13: Clear/blur from the field
      case 13: case 27:
        $(e.target)[0].blur()
        Dragger.clear()
        return false
    }
  },
  //After blurring from content field, update the property in mongo
  'blur [contenteditable]': function(e) {
    var that = this, isStyle = $(e.target).hasClass('style'),
      isName = $(e.target).hasClass('name'), 
      elementPath = getElementPath(Session.get('element')),
      //Grab the value
      theValue = $(e.target).text()
    $(e.target).html(getColorLinkString(theValue))
    if(this[isName ? 'name' : 'value'] == theValue) return
    //Update the db object with the new style
    if(isStyle) {
      if(isName) delete elementPath.element.style[that.name]
      elementPath.element.style[isName ? theValue : that.name] = 
        isName ? that.value : theValue
    } else elementPath.element[isName ? theValue : $(e.target).attr('for')] = 
      isName ? that[$(e.target).attr('for')] : theValue
    //Update Mongo
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
    //Delete it from the element so Meteor doesn't repeat the text
    $(e.target).text("")
  },
  'mousedown div.button.add': function(e) {
    //Get the element path object
    var elementPath = getElementPath(Session.get('element'))
    //Add a new style with undefined name
    elementPath.element.style['undefined'] = ' '
    //Update Mongo
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  }
})


Template.dragger_mode_element_style.helpers({
  value: function() {
    return getColorLinkString(this.value)
  }
})

Template.dragger_mode_element_style.events({
  'mousedown div.button.delete': function(e) {
    if(!e.shiftKey && !confirm('Sure?')) return
    var elementPath = getElementPath(Session.get('element'))
    delete elementPath.element.style[this.name]
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
    if(e.shiftKey) Dragger.clear()
  },
  'mousedown div.value a': function(e) {
    var that = this
    $(e.target).spectrum({  
      showAlpha: true,            // Show alpha controls
      showButtons: true,          // Show OK and Cancel buttons
      clickoutFiresChange: true,  // Allow affirmative clickouts
      chooseText: 'OK',           // Set OK button text
      color: $(e.target).text(),  // Set the initial color
      showInput: true,            // Show text input
      preferredFormat: "rgb",
      change: function(color) {
        //Set the link text to the new 'color', color value
        this.innerText = color.toRgbString()
        //Get the mongo element
        var elementPath = getElementPath(Session.get('element')),
          newValue = $(this).parent().text(),
          caller = this
        if(!newValue) return
        //Set the style property with the new value
        elementPath.element.style[that.name] = newValue
        //Clear the value (because hack)
        $(caller).parent().html('')
        //Update the element on the server
        Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style, function() {
          $(caller).parent().html(getColorLinkString(newValue))
        })
      },
      hide: function(color) {
        $('[_id=' + Session.get('element') + ']').css(that.name, $(this).parent().text())
      },
      move: function(color) {
        //Generate the new full string css value
        var moveValue = that.value.replace(this.innerText, color.toRgbString())
        //Update the browser side element (Reduces server side calls)
        $('[_id=' + Session.get('element') + ']').css(that.name, moveValue)
      },
      show: function() {
        Dragger.clear()
      }
    })
  }
})

Template.dragger_mode_element_style.rendered = function() {
  setTimeout(function(){
    try{$('[for="undefined"]')[0].focus()}catch(e){}
  })
}
