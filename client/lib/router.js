Router.configure({
	layoutTemplate: 'hatchery'
})

Router.map(function() {
	this.route('catalog')
	this.route('products')
	this.route('home', {
		path: '/'
	});
});
