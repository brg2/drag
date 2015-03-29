//Defaults editor to hidden
Session.setDefault("visible", false)
//Defaults editor to right side
Session.setDefault('position', 'right')
//Defaults editor mode to element
Session.setDefault('mode', "element")

//Global helpers
UI.registerHelper("getStyle", function () {
    return Dragger.obj2css(this.style)
});

//Body helpers
Template.body.helpers({
  //Returns if the editor is visible or not
  visible: function() {
    return Session.get('visible')
  }
})

//Add some key bindings after the body finishes rendering
Template.body.rendered = function() {
	Meteor.Keybindings.add({
    //Toggle editor left or right
	  'ctrl+shift+e': function(){ if(Session.get('visible')) Session.set('position', 
      Session.get('position') == 'right' ? 'left' : 'right'); return false }
    //Open or close editor
	  ,'ctrl+e': function(){ Session.set('visible', !Session.get('visible')); return false }
    //Add new element
	  ,'alt+a': function(){ if(Session.get('visible'))  {Meteor.call('add'); return false} }
    //Clear all elements
	  ,'alt+c': function(){ if(Session.get('visible') && confirm('Sure?')) 
      Meteor.call('clear'); Session.set('element',''); return false}
    //Delete element
    ,'shift+delete': function(){ 
      if(Session.get('visible') && $(document.activeElement).attr('contenteditable') === undefined && confirm('Sure?'))
        Meteor.call('remove', Session.get('element')); Session.set('element', ''); return false}
    //Move the element up
    ,'↑': function() {
      // alert('up')
    }
    //Move element down
    ,'↓': function(){ 
      // alert('down')
    }
    //Move element left
    ,'←': function(){ 
      // alert('left')
    }
    //Move element right
    ,'→': function(){ 
      // alert('right')
    }
	})
}
