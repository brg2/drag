Meteor.publish("elements", function() {
	return Elements.find(this.userId ? {u: this.userId} : {u: FM_ADMIN_ID})
})

Meteor.publish("templates", function() {
	return Templates.find(this.userId ? {u: this.userId} : {u: FM_ADMIN_ID})
})
