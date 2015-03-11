Template.dragger_mode_source.helpers({
	config: function() {
		//Setup some variables
		var templateName = this.name
		return function(editor) { try {
			//Supply some settings for ace
	    	editor.setTheme('ace/theme/monokai')
    		editor.getSession().setMode('ace/mode/' + templateName)
    		editor.getSession().setUseWrapMode(true)
		} catch(e) {} }
	},
	//Return a template object for the ace editor and other things
	getTemplate: function() {
		var tmpl = Templates.findOne({_id: this.toString()}, {fields: {rendered: 0}})
		if(!tmpl) return false
		tmpl.aceid = AH_EDITOR_PREFIX + this
		return tmpl
	}
})

Template.dragger_mode_source.events({
	//Update the template name after blurring from the template name div
	'blur div.name': function(e) {
		var newname = $(e.target).html()
		Meteor.call('updateTemplateName', this._id, newname)
	},
	//Watch for enter to blur
	'keydown div.name': function(e) {
	    switch(e.which || e.keyCode) {
	      //Enter to blur
	      case 13:
	        Dragger.clear()
	    }
	}
})