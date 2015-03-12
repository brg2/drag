Template.hatchery.helpers({
  //Returns a list of Elements from Mongo
  elements: function() {
    return Elements.find()
  },
  // Setup the template from the template code stored in Mongo
  templates: function() {
    var that = this, objTmpls = {}
    //Get the templates collection
    var tmpls = Templates.find( {_id: {$in: this.templates}} ).fetch()
    if(!tmpls.length) return this.templates
    //Cycle through the template list and convert to object
    _.each(tmpls, function(tmpl) {
      //Give the element
      tmpl.element = that
      //Make the association
      objTmpls[tmpl.name] = tmpl
    })
    //Render the html first
    if(!objTmpls.html || !objTmpls.html.rendered) return
    //If there is source code, then evaluate that here and save as a new or existing Meteor Template
    Template[objTmpls.html._id] = new Template("Template." + objTmpls.html._id, eval(objTmpls.html.rendered))
    //Render the javascript next
    if(!objTmpls.javascript || !objTmpls.javascript.rendered) return
    //Get the rendered source code from Blaze
    var src
    try { src = Blaze.toHTMLWithData(eval(objTmpls.javascript.rendered), {_id: objTmpls.html._id}) } catch(e) {}
    //Evaluate the code
    try{eval( src )}catch(e) {
      console.log('Error in code:', src)
    }
    //Return the templates
    return tmpls
  }
})

function updateMongoElement(element, lastParentId, newParentId) {
  //Variables
  var style, elementId, dbstyle
  //Get the element style
  style = {top: element.css('top'), left: element.css('left'), width: element.css('width'), height: element.css('height') }
  //Get the DB style
  ds = getElementPath(Session.get('element')).element.style
  //Update the style
  if(ds.top) ds.top = style.top
  if(ds.left) ds.left = style.left
  if(ds.width) ds.width = style.width
  if(ds.height) ds.height = style.height
  //Get the element id to update
  elementId = element.attr(AH_ID)
  //Update element
  Meteor.call('updateElement', elementId, 'style', ds, lastParentId, newParentId, function(err) {
    if(err) console.log(err)
  })
}

Meteor.startup(function() {
  //Start the dragger and tell it to run the update after a drag ends
  Dragger.onstop(updateMongoElement)
})