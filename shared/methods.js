Meteor.methods({
  //Add a new element
  add: function() {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    //Variables
    var style, tmplHTML, tmplJS, htmlID, jsID, strHTML, strJS
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
    var cb = function(err, tmpl, strInitText) {
      if(! Meteor.isServer) return
      if(tmpl._id) ShareJS.model.create(tmpl._id, 'text', undefined, Meteor.bindEnvironment(function(err) {
        //Initialize the document with some template code
        ShareJS.model.applyOp(tmpl._id, {
          op: [{i:strInitText, p:0}], //Insert at position 0
          v: 0, // of version 0
          meta: null // with no meta
        })
        // If there was no error, add a new listener to update the template
        if(!err) addTemplateListener(tmpl)
      }))
    }
    //Generate a new HTML template
    htmlID = Fake.word() + Templates._makeNewID()
    strHTML = "{{#with element}}\n<div "+ AH_ID +"='{{_id}}'>\n\t<!-- Insert HTML code here -->\n\t" + Fake.word() + "\n\t<!-- Load children -->\n\t{{> hatchery}}\n</div>\n<style>\n\t/* CSS code here */\n\t["+ AH_ID +"={{_id}}] {\n\t\t{{getStyle}}\n\t}\n</style>\n{{/with}}\n"
    tmplHTML = {_id: htmlID, name: 'html', rendered: compileTemplate(strHTML) }
    Templates.insert(tmplHTML, function(err, tmplid){ cb(err, tmplHTML, strHTML) })
    //Generate a new Javascript template
    strJS = "Template['{{_id}}'].helpers({\n\t// helper code here\n})\n\nTemplate['{{_id}}'].events({\n\t// and event code here\n})\n"
    tmplJS = {_id: jsID = Fake.word() + Templates._makeNewID(), name: 'javascript', rendered: compileTemplate(strJS) }
    Templates.insert(tmplJS, function(err, tmplid){ cb(err, tmplJS, strJS) })
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
      if(! Meteor.isServer) return
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
    if(Meteor.isServer) console.log('updating element')
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    Hatchery.updateElement.apply(Hatchery, arguments)
  },
  //Update the name of the template
  updateTemplateName: function(templateId, strNewTemplateName) {
    if (!Roles.userIsInRole(Meteor.user(), ['admin','edit-app'])) return false
    Templates.update({ _id: templateId }, { $set: { name: strNewTemplateName }})
  }
})
