var map;
function initialize(){
	var mapOptions = {
		center: new google.maps.LatLng(37.774929, -122.419416),
		zoom: 12
	};
	map = new google.maps.Map( document.getElementById('mapCanvas'), mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);

Movie = Backbone.Model.extend({
	initialize: function(){
		$('.searchResults').append("<li>"+this.get('title') +"</li>");

		geocoder = new google.maps.Geocoder();

		var that = this;
		console.log("geocoding "+this.get('locations'));
		console.log("    for " + this.get('title')+this.id );
		var foo = geocoder.geocode({
			address: this.get('locations') + " San Francisco"
		}, function(results, status){
			if(!results){
				console.log('fail...')
				console.log( that.get('locations') +" did not work" );
			}
			if(!results[0]){
				console.log('fail?');
				console.log( that.get('locations') +" did not work" );
				return;
			}
			var lat = results[0].geometry.location.d;
			var lon = results[0].geometry.location.e;
			console.log(lat);
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(lat, lon),
				map:map,
				title: that.get('title')+that.id
			});
		});
		
	}
});

Movies = Backbone.Collection.extend({
	model: Movie,
	url: '/search' 
});

SearchArea = Backbone.View.extend({
	
	events: {
		"keyup .searchBox": "search",
	},

	initialize: function(){
		console.log('initialized and linked to: ' + this.$el );
	},

	search: function(e){
		query = this.$('.searchBox').val();
		var that = this;
		if(query.length > 3){
			theMovieResults.fetch({
				reset:true,
				data: {'q': query },
				success: function(){
					//$('.searchResults').a
					//var template: _.template($('.searchResultsTemplate').html, {theMovieResults.models});
					//that.$el.html(template);
				},
				error: function(){
					console.log('something bad happened');
				}
			});
		}
	}
});
var theSearchArea = new SearchArea({ el: $('.searchContainer') });
var theMovieRsults = new Movies();
