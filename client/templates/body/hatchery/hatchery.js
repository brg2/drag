Template.hatchery.helpers({
  //Returns a list of Elements from Mongo
  elements: function() {
    return Elements.find()
  },
  // Setup the template from the template code stored in Mongo
  templates: function(parentContext) {    
    var that = this, objTmpls = {}, tmpls
    //Give parent context
    if(parentContext) that.parent = parentContext
    //Get the templates collection
    tmpls = Templates.find( {_id: {$in: this.templates}} ).fetch()
    if(!tmpls.length) return this.templates
    //Cycle through the template list and convert to object
    _.each(tmpls, function(tmpl) {
      //Give the element
      tmpl.element = that
      //Make the association
      objTmpls[tmpl.name] = tmpl
    })
    // console.log('tmpls', tmpls)
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

updateMongoElement = function(dbelement, lastParentId, newParentId) {
  var curdbel = getElementPath(dbelement._id).element
  _.extend(curdbel.style, dbelement.style)
  //Update element
  Meteor.call('updateElement', dbelement._id, 'style', curdbel.style, lastParentId, newParentId, function(err) {
    if(err) console.log(err)
  })
}

Meteor.startup(function() {
  //Start the dragger and tell it to run the update after a drag ends
  Dragger.onstop(updateMongoElement)
})
