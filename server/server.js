fs = Npm.require('fs')
__ROOT_APP_PATH__ = fs.realpathSync(process.env.PWD)
try{Math.randomInt = function(min, max) {return Math.floor(Math.random() * (max - min)) + min}}catch(e){}
try{Math.randomColor = function(isOpaque){return 'rgba(' + Math.randomInt(0,255) + ', ' + Math.randomInt(0,255) + ', ' + Math.randomInt(0,255) + ', ' + (isOpaque ? 1 : Math.random()) + ')'}}catch(e){}

Meteor.methods({
  //Add a new element
  add: function() {
    //Variables
    var style, htmlID, jsID
    //Generate random style
    style = {
      top: Math.randomInt(50,100) + 'px',
      left: Math.randomInt(50,100) + 'px',
      width: Math.randomInt(100,200) + 'px',
      height: Math.randomInt(100,200) + 'px',
      'background-color': Math.randomColor(), 
      color: Math.randomColor(true), 
      border: '10px solid ' + Math.randomColor(),
      position: 'absolute'
    }
    //Setup callback that will start a new sharejs document for each template being created
    var cb = function(err, tmplid, strInitText) {
      if(tmplid) ShareJS.model.create(tmplid, 'text', undefined, Meteor.bindEnvironment(function(err) {
        //Initialize the document with some template code
        ShareJS.model.applyOp(tmplid, {
          op: [{i:strInitText, p:0}], //Initiaze at position 0
          v: 0, // of version 0
          meta: null // with no meta
        })
        // If there was no error, add a new listener to update the template
        if(!err) addTemplateListener(tmplid)
      }))
    }
    //Generate a new HTML template
    Templates.insert({_id: htmlID = Fake.word() + Templates._makeNewID(), name: 'html'}, function(err, tmplid){cb(err, tmplid, 
      "{{#with element}}\n<div "+ AH_ID +"='{{_id}}'>\n\t<!-- Insert HTML code here -->\n\t{{content}}\n\t<!-- Load children -->\n\t{{> hatchery}}\n</div>\n<style>\n\t/* CSS code here */\n\t["+ AH_ID +"={{_id}}] {\n\t\t{{getStyle}}\n\t}\n</style>\n{{/with}}\n"
      )})
    //Generate a new Javascript template
    Templates.insert({_id: jsID = Fake.word() + Templates._makeNewID(), name: 'javascript'}, function(err, tmplid){cb(err, tmplid, 
      "Template['{{_id}}'].helpers({\n\t// helper code here\n\tcontent: function(){\n\t\treturn this.content\n\t}\n})\n\nTemplate['{{_id}}'].events({\n\t// and event code here\n})\n"
      )})
    //Create new element and link the template 
    Elements.insert({_id: Fake.word() + Elements._makeNewID(), style: style, content: Fake.word(), templates: [htmlID, jsID]})
  },
  //Clear tree
  clear: function() {
    //Remove all the elements
    Elements.remove({})
    //Cycle through the templates
    _.each(Templates.find().fetch(), function(template) {
      //Remove the associated document in ShareJS
      ShareJS.model.delete(template._id)
    })
    //Remove all the templates
    Templates.remove({})
  },
  //Get the element path object of an element id
  getElement: function(elementId) {
    return getElementPath(elementId)
  },
  //Remove the element
  remove: function(elementId) {
    var elementPath = getElementPath(elementId)
    if(elementPath.element.templates) Templates.remove({_id: {$in: elementPath.element.templates}})
    Elements.remove({_id:elementId})
  },
  //Update element
  updateElement: function() {
    Hatchery.updateElement.apply(Hatchery, arguments)
  },
  //Update the name of the template
  updateTemplateName: function(templateId, strNewTemplateName) {
    Templates.update({ _id: templateId }, { $set: { name: strNewTemplateName }})
  }
})
//Array of templates with listeners
_templateListeners = {}
//Add a listener to a template so it updates the compiled code in Templates if there is a change
addTemplateListener = function(templateId) {
  //If the template already has a listener, then return
  if(_templateListeners[templateId]) return
  //Otherwise set it and continue
  else _templateListeners[templateId] = true
  //Call the ShareJS add listener method
  ShareJS.model.listen(templateId, undefined, Meteor.bindEnvironment(function() {
    //When the document changes, get the current source code 
    ShareJS.model.getSnapshot(templateId, function(err, obj) {
      // and compile it to the Templates collection
      Templates.update({ _id: templateId }, { $set: { rendered: compileTemplate(obj.snapshot) }})
    })
  }), function(err) {
    //If there was a problem (like the document doesn't exist) then remove it from the template listeners array
    delete _templateListeners[templateId]
  })
}
//When meteor is done loading...
Meteor.startup(function() {
  // cycle through all the templates
  _.each(Templates.find().fetch(), function(template) {
    // and setup listeners to update the Templates collection
    addTemplateListener(template._id)
  })
})
