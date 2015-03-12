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
      case 13:
        $(e.target)[0].blur()
    }
  },
  //After blurring from content field, update the property in mongo
  'blur [contenteditable]': function(e) {
    var that = this, isStyle = $(e.target).hasClass('style'),
      isName = $(e.target).hasClass('name'), 
      elementPath = getElementPath(Session.get('element')),
      //Grab the value
      theValue = $(e.target).text()
      //Delete it from the element so Meteor doesn't repeat the text
      $(e.target).text("")
    setTimeout(function() {
      if(isStyle) {
        if(isName) delete elementPath.element.style[that.name]
        elementPath.element.style[isName ? theValue : that.name] = 
          isName ? that.value : theValue
      } else elementPath.element[isName ? theValue : $(e.target).attr('for')] = 
        isName ? that[$(e.target).attr('for')] : theValue
      Meteor.call('updateElement', Session.get('element'), '', elementPath.element)
    })
  },
  'mousedown div.button.add': function(e) {
    var elementPath = getElementPath(Session.get('element'))
    elementPath.element.style['undefined'] = ' '
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  }
  //Double click to add or double click with shift key to delete
  // 'dblclick div.name': function(e) {
  //   var elementPath = getElementPath(Session.get('element'))
  //   if(e.shiftKey) elementPath.element.style[Fake.word()] = Fake.word()
  //   else if(confirm('Sure?')) delete elementPath.element.style[this.name]
  //   else return
  //   Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  // }
})



Template.dragger_mode_element_style.events({
  'mousedown div.button.delete': function(e) {
    if(!confirm('Sure?')) return
    var elementPath = getElementPath(Session.get('element'))
    delete elementPath.element.style[this.name]
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  }
})

Template.dragger_mode_element_style.rendered = function() {
  setTimeout(function(){
    try{$('[for="undefined"]')[0].focus()}catch(e){}
  })
}