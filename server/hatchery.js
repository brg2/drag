Hatchery = (function() {   

  /* Object */
  var mainobj = {
    export: function(strTemplateName) {
      var els = Elements.find().fetch()
      var strTemplate = '\n<template name="' + (strTemplateName||'default') + '">'
      strTemplate += getElementsHTML(els)
      strTemplate += '\n</template>\n'
      return strTemplate
    },

    updateElement: function() {
      updateElement.apply(this, arguments)
    }
  }
  /* End Object */
  
  /* Private Functions */
  function addElementToParent(element, parentId) {
    var elementId = element._id
    //Find the path of the element
    var tree = Elements.find().fetch(), options = {}, strPath, parentPath
    if(!parentId) {
      //Or update the root
      Elements.insert(element, function(err){})
      return
    }
    //Get the new parent path
    parentPath = getElementPath(parentId, tree)
    //Setup the new parent update options
    strPath = parentPath.path
    if(strPath && parentPath.index >-1) strPath += '.' + parentPath.index + '.children'
    else strPath = 'children'
    options[strPath] = element
    //Update mongo
    Elements.update({_id: parentPath.root}, {$push : options}, function(err){})
  }
  function getElementsHTML(els, tabCount) {
    if(tabCount === undefined) tabCount = 1
    var strText = "", strTabs = (new Array(tabCount+1)).join('\t')
    //Update the template
    for(var i in els) {
      var result = els[i]
      if(typeof result !== 'object') continue
      var tagName = result.tag || 'div'
      var attribs = result.attributes
      strText += '\n' + strTabs + '<' + tagName + ' '
      var arrAttribs = []
      for(var i in attribs) {
        arrAttribs.push(i + '="' + attribs[i] + '"')
      }
      arrAttribs.push('_id="' + result._id + '"')
      strText += arrAttribs.join(' ') + '>'
      if(result.children) strText += getElementsHTML(result.children, tabCount+1)
      strText += '\n' + strTabs + '</' + tagName + '>'
    }
    return strText
  }

  function removeElementFromParent(element, parentId, cb) {
    //Find the path of the element
    var tree = Elements.find().fetch(), options = {}, strPath, elementId = element._id, parentPath, strPath
    if(!parentId) {
      //Or the root
      Elements.remove({_id: elementId}, function(err){})
      return
    }
    //Get the old parent path
    parentPath = getElementPath(parentId, tree)
    strPath = parentPath.path
    if(strPath && parentPath.index >-1) strPath += '.' + parentPath.index + '.children'
    else strPath = 'children'
    //Setup the options
    options[strPath] = {_id:elementId}
    //Update mongo
    Elements.update({_id: parentPath.root}, {$pull : options}, function(err){})
  }

  function updateElement(elementId, strPath, obj, lastParentId, newParentId, cb) {
    //Get the path of the element to update
    var elementPath = getElementPath(elementId)
    //Update the element
    if(obj === false) eval("delete elementPath.element" + (strPath ? '.' + strPath : ''))
    else eval("elementPath.element" + (strPath ? '.' + strPath : '') + " = obj")
    //If parents don't change
    if(lastParentId == newParentId) {
      //Update element only
      updateMongoElement(elementPath, strPath, obj)
      return
    }
    //Or remove from the old parent
    removeElementFromParent(elementPath.element, lastParentId)
    //Add to the new parent
    addElementToParent(elementPath.element, newParentId, function(err){}) 
  }

  function updateMongoElement(elementPath, strPath, obj) {
    var options = obj
    if(strPath || elementPath.path) {
      options = {$set : {}}
      if(strPath) options['$set'][(elementPath.path ? elementPath.path + '.' + elementPath.index + '.' : '') + strPath] = obj
      else options['$set'][elementPath.path + '.' + elementPath.index] = obj
    }
    //Update element if parents are equal
    Elements.update({_id: elementPath.root}, options, function(err){})
  }
  /* End Private Functions */

  return mainobj
})()