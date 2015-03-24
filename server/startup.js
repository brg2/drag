//When meteor is done loading...
Meteor.startup(function() {
  // cycle through all the templates
  _.each(Templates.find().fetch(), function(template) {
    // and setup listeners to update the Templates collection
    addTemplateListener(template)
  })

  if (Meteor.users.find().fetch().length === 0) {
    console.log('Creating users...');

  	var id = Accounts.createUser({
    	username: 'admin',
    	password: "password"
  	});

  	Roles.addUsersToRoles(id, ['admin']);
  }
})
