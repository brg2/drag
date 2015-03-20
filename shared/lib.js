compileTemplate = function(strHTML) {
  try{ return SpacebarsCompiler.compile(strHTML, { isTemplate:true })} catch (e) {}
  return false
}

getElementPath = function(elementId, tree, rootId, strPath) {
  if(tree === undefined) tree = Elements.find().fetch()
  var found = false
  for(var i in tree) {
    var el = tree[i]
    if(!el || !el._id) continue
    var index = rootId ? i : -1
    if(el._id == elementId || !elementId) { 
      found = {root: rootId || elementId, path: strPath || '', index: parseInt(index), element: el}
      break
    }
    if(!el.children || !el.children.length) continue
    var nextPath = (strPath ? (strPath + '.' + i + '.') : '') + 'children'
    if(found = getElementPath(elementId, el.children, rootId || el._id, nextPath)) break
  }
  return found
}

getTemplatePath = function(elementId, templateId) {
  var el = getElementPath(elementId)
  if(!el || !el.element || !el.element.templates) return false
  var index, found
  _.each(el.element.templates, function(template, i) {
    if(template.value != templateId) return
    index = i
    found = template
    return false
  })
  if(!found) return false
  return {template: found, index: index, path: el}
}

//Some math methods
try{Math.randomInt = function(min, max) {return Math.floor(Math.random() * (max - min)) + min}}catch(e){}
try{Math.randomColor = function(isOpaque){return 'rgba(' + Math.randomInt(0,255) + ', ' + Math.randomInt(0,255) + ', ' + Math.randomInt(0,255) + ', ' + (isOpaque ? 1 : Math.random()) + ')'}}catch(e){}
