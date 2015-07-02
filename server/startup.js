FM_ADMIN_ID = false

//When meteor is done loading...
Meteor.startup(function() {
  // cycle through all the templates
  _.each(Templates.find().fetch(), function(template) {
    // and setup listeners to update the Templates collection
    addTemplateListener(template)
  })

  //Create users if they don't exist
  if (Meteor.users.find().fetch().length === 0) {
    console.log('Creating users...');

  	var id = Accounts.createUser({
    	username: 'admin',
    	password: "password"
  	});

    //Assign admin role
  	Roles.addUsersToRoles(id, ['admin']);

    //Associate global admin id variable
    FM_ADMIN_ID = id
  } else {
    FM_ADMIN_ID = Meteor.users.findOne({username: "admin"})._id
  }
})
