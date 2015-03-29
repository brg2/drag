//Array of templates with listeners
_templateListeners = {}
//Add a listener to a template so it updates the compiled code in Templates if there is a change
addTemplateListener = function(template) {
  var templateId = template._id
  //If the template already has a listener, then return
  if(_templateListeners[templateId]) return
  //Otherwise set it and continue
  else _templateListeners[templateId] = true
  //Call the ShareJS add listener method
  ShareJS.model.listen(templateId, undefined, Meteor.bindEnvironment(function() {
    //When the document changes, get the current source code 
    ShareJS.model.getSnapshot(templateId, function(err, obj) {
      // and compile it to the Templates collection
      Templates.update({ _id: templateId }, { $set: { rendered:
          // Compile using Meteor's Spacebars parser
          compileTemplate(obj.snapshot)
      }})
    })
  }), function(err) {
    //If there was a problem (like the document doesn't exist) then remove it from the template listeners array
    delete _templateListeners[templateId]
  })
}

compileTemplate = function(strTemplate) {
  try{ return SpacebarsCompiler.compile(strTemplate, { isTemplate:true })} catch (e) {}
  return false
}

//Method used to get a caret position inside a contenteditable div
getCaretPosition = function(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}

var AH_cssColorsRegex = /aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|#[\da-zA-Z]+|rgba?\(.*?\)|hsla?\(.*?\)|hsva?\(.*?\)/gi
getColorsFromString = function(strValue) {
  return strValue.match(AH_cssColorsRegex)
}

//Convert a string into an html block with links that open a color picker
getColorLinkString = function(strValue) {
  var colorVal = strValue, curColors = getColorsFromString(colorVal);
  if(!curColors) return colorVal
  _.each(curColors, function(color) {
    colorVal = colorVal.replace(color, '<a href="#">'+color+'</a>')
  })
  return colorVal
}

//Get an element path object containing the path of the element in the mongo db tree
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

//Do the same as the elements but for a template
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
