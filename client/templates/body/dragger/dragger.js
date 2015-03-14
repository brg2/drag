Template.dragger.helpers({
  dragging: function() {
    return Session.get('dragging')
  },

  element: function() {
    var el = getElementPath(Session.get('element')).element
    if(!Session.get('element') && el) Session.set('element', el._id)
    return el
  },

  mode: function() {
    return Session.get('mode')
  },

  modeTemplate: function(){
    return 'dragger_mode_' + Session.get('mode')
  },

  position: function() {
    return Session.get('position')
  },
})

Template.dragger.events({
  'mousedown #overlay, touchstart #overlay': Dragger.start,
  'mousemove #overlay': Dragger.update,
  'mouseup #overlay': Dragger.stop,
  'mousedown #editor div.mode': function(e) {
    Session.set('mode', Session.get('mode') == 'element' ? 'source' : 'element')
    return false
  }
})
