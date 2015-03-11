Meteor.publish("elements", function() {
  return Elements.find()
});

Meteor.publish("templates", function() {
  return Templates.find()
});