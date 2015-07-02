Router.configure({
	layoutTemplate: 'hatchery'
})

Router.map(function() {
	this.route('admin', {
		action: function() {
			Session.set('visible', true)
		}
	})
	this.route('catalog')
	this.route('products')
	this.route('home', {
		path: '/'
	});
});
