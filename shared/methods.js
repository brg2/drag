Meteor.methods({
  //Add a new element
  add: function() {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    //Variables
    var style, htmlID, jsID
    //Generate random style
    style = {
      'background-color': Math.randomColor(), 
      border: '10px solid ' + Math.randomColor(),
      color: Math.randomColor(true), 
      height: Math.randomInt(100,200) + 'px',
      left: Math.randomInt(50,100) + 'px',
      position: 'absolute',
      top: Math.randomInt(50,100) + 'px',
      width: Math.randomInt(100,200) + 'px'
    }
    //Setup callback that will start a new sharejs document for each template being created
    var cb = function(err, tmplid, strInitText) {
      if(tmplid) ShareJS.model.create(tmplid, 'text', undefined, Meteor.bindEnvironment(function(err) {
        //Initialize the document with some template code
        ShareJS.model.applyOp(tmplid, {
          op: [{i:strInitText, p:0}], //Insert at position 0
          v: 0, // of version 0
          meta: null // with no meta
        })
        // If there was no error, add a new listener to update the template
        if(!err) addTemplateListener(tmplid)
      }))
    }
    //Generate a new HTML template
    Templates.insert({_id: htmlID = Fake.word() + Templates._makeNewID(), name: 'html'}, function(err, tmplid){cb(err, tmplid, 
      "{{#with element}}\n<div "+ AH_ID +"='{{_id}}'>\n\t<!-- Insert HTML code here -->\n\t" + Fake.word() + "\n\t<!-- Load children -->\n\t{{> hatchery}}\n</div>\n<style>\n\t/* CSS code here */\n\t["+ AH_ID +"={{_id}}] {\n\t\t{{getStyle}}\n\t}\n</style>\n{{/with}}\n"
      )})
    //Generate a new Javascript template
    Templates.insert({_id: jsID = Fake.word() + Templates._makeNewID(), name: 'javascript'}, function(err, tmplid){cb(err, tmplid, 
      "Template['{{_id}}'].helpers({\n\t// helper code here\n})\n\nTemplate['{{_id}}'].events({\n\t// and event code here\n})\n"
      )})
    //Create new element and link the template 
    Elements.insert({_id: Fake.word() + Elements._makeNewID(), style: style, templates: [htmlID, jsID]})
  },
  allowUserTo: function(strUsername, arrRoles) {
    if(! Meteor.isServer) return false
    if (Roles.userIsInRole(Meteor.user(), ['admin','manage-users'])) {
      Roles.addUsersToRoles(Meteor.users.findOne({username: strUsername})._id, arrRoles)
    } else
      throw new Meteor.Error(403, "Not authorized to manage users");
  },
  banUserFrom: function(strUsername, arrRoles) {
    if(! Meteor.isServer) return false
    if (Roles.userIsInRole(Meteor.user(), ['admin','manage-users'])) {
      Roles.removeUsersFromRoles(Meteor.users.findOne({username: strUsername})._id, arrRoles)
    } else
      throw new Meteor.Error(403, "Not authorized to manage users");
  },
  //Clear tree
  clear: function() {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
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
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    var elementPath = getElementPath(elementId)
    if(elementPath.element.templates) Templates.remove({_id: {$in: elementPath.element.templates}})
    Elements.remove({_id:elementId})
  },
  //Update element
  updateElement: function() {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    Hatchery.updateElement.apply(Hatchery, arguments)
  },
  //Update the name of the template
  updateTemplateName: function(templateId, strNewTemplateName) {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
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