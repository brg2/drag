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
    if(Session.get('dragging')) return
    setTimeout(function(){document.execCommand('selectAll')})
  },
  //Hack for dragging over editor fields
  'mousedown div': function(e) {
    if(Session.get('dragging')) return false
  },
  // Handle key events in div 
  'keydown [contenteditable]': function(e) {
    switch(e.which || e.keyCode) {
      //Up - 38, Down - 40 (todo: have up/down arrows increment/decrement numeric values)
      case 38: case 40:
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
      theValue = $(e.target).html().replace(/(<([^>]+)>)/ig,"")
      if(this[isName ? 'name' : 'value'] == theValue) return
      //Delete it from the element so Meteor doesn't repeat the text
      $(e.target).text("")
    setTimeout(function() {
      if(isStyle) {
        if(isName) delete elementPath.element.style[that.name]
        elementPath.element.style[isName ? theValue : that.name] = 
          isName ? that.value : theValue
      } else elementPath.element[isName ? theValue : $(e.target).attr('for')] = 
        isName ? that[$(e.target).attr('for')] : theValue
      Meteor.call('updateElement', Session.get('element'), '', elementPath.element, function() {
        //Hack to bring back the correct value (Meteor has difficulty with contenteditable divs)
        $(e.target).text(theValue)
      })
    })
  },
  'mousedown div.button.add': function(e) {
    var elementPath = getElementPath(Session.get('element'))
    elementPath.element.style['undefined'] = ' '
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  }
})



Template.dragger_mode_element_style.helpers({
  value: function() {
    var colorVal = this.value, curColors = getColorsFromString(colorVal);
    if(!curColors) return colorVal
    _.each(curColors, function(color) {
      colorVal = colorVal.replace(color, '<a href="#">'+color+'</a>')
    })
    return colorVal
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
        //Set the link text to the new color value
        this.innerText = color.toRgbString()
        //Get the mongo element
        var elementPath = getElementPath(Session.get('element'))
        //Set the style property with the new value
        elementPath.element.style[that.name] = $(this).parent().text()
        //Update the element on the server
        Meteor.call('updateElement', Session.get('element'), '', elementPath.element)
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
    return false
  }
})

Template.dragger_mode_element_style.rendered = function() {
  setTimeout(function(){
    try{$('[for="undefined"]')[0].focus()}catch(e){}
  })
}
