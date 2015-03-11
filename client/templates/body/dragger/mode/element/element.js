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
  'focus div': function(e) {
    if(Session.get('dragging')) return
    setTimeout(function(){document.execCommand('selectAll')})
  },
  //Hack for dragging over editor fields
  'mousedown div': function(e) {
    if(Session.get('dragging')) return false
  },
  // Handle key events in div 
  'keydown div': function(e) {
    switch(e.which || e.keyCode) {
      //Up - 38, Down - 40 (todo: have up/down arrows increment/decrement numeric values)
      case 38: case 40:
        return false
      // Enter - 13: Clear/blur from the field
      case 13:
        Dragger.clear()
    }
  },
  //After blurring from content field, update the property in mongo
  'blur [contenteditable]': function(e) {
    var that = this, isStyle = $(e.target).hasClass('style'),
      isName = $(e.target).hasClass('name'), 
      elementPath = getElementPath(Session.get('element'))
    setTimeout(function() {
      if(isStyle) {
        if(isName) delete elementPath.element.style[that.name]
        elementPath.element.style[isName ? $(e.target).text() : that.name] = 
          isName ? that.value : $(e.target).text()
      } else elementPath.element[isName ? $(e.target).text() : $(e.target).attr('for')] = 
        isName ? that[$(e.target).attr('for')] : $(e.target).text()
      Meteor.call('updateElement', Session.get('element'), '', elementPath.element)
    })
  },
  //Double click to add or double click with shift key to delete
  'dblclick div.name': function(e) {
    var elementPath = getElementPath(Session.get('element'))
    if(e.shiftKey) elementPath.element.style[Fake.word()] = Fake.word()
    else if(confirm('Sure?')) delete elementPath.element.style[this.name]
    else return
    Meteor.call('updateElement', Session.get('element'), 'style', elementPath.element.style)
  }
})