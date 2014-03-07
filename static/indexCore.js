var map;
var markerArray = [];
function initialize(){
// turn google maps on
	var mapOptions = {
		//center it on SF
		center: new google.maps.LatLng(37.774929, -122.419416),
		zoom: 12
	};
	map = new google.maps.Map( document.getElementById('mapCanvas'), mapOptions);
}
//turn google maps on when the page loads
google.maps.event.addDomListener(window, 'load', initialize);
geocoder = new google.maps.Geocoder();

listOfUniqueTitles = [];
$(function(){
	$('.searchBox').autocomplete({
		source: listOfUniqueTitles
	});
	$('.searchBox').on('autocompleteselect', function(event, ui){
		Backbone.history.fragment = null;
		myRouter.navigate('movie/'+encodeURI(ui.item.value), {trigger: true}); // TODO instead of encodeURI, change spaces for -dashes?
	});
});

SearchResult = Backbone.Model.extend({
	initialize: function(){

	},
	render: function(){
		$('.searchResults').append('<li class=".'+this.get('title')+'">'+this.get('title')+'</li>');	
	}
});


function lessInfo( theAttributeYouWantToDisplayAsSubtitle ){

	/*
	out = "";
	out += "<div class='.smallLocation'>";
	foreach attr in foo{
		out += "<li>"+userify(attr)+": "+this.get(attr)+"</li>";
	}
	out += "</div>";
	return out;
	*/
}
function moreInfo(){
	return lessInfo( ['title', 'release_date', 'fun_facts', 'actor_1', 'actor_2', 'actor_3', 'production_company', 'director', 'locations', 'writer', 'distributor'] );
}

function userify( word ){ // Return prettier words for the user to read. ex: actor_1 -> First actor
	return dictionary[word] != undefined ? dictionary[word] : word;	
} var dictionary = {
	"title":"Title",
	"release_date": "Release Date",
	"production_company": "Production Company",
	"director":"Director",
	"actor_1": "First actor",
	"actor_2":"Second actor",
	"actor_3":"Third actor",
	"locations": "Locations",
	"distributor": "Distributor",
	"writer":"Writer"};

function templateLocationForList( t ){
	out = "<div data-id="+t.id+" class='aLocation'>";
	at = t.attributes;
	for(a in at){
		out += '<span class='+a+'>'+userify(a)+': '+at[a]+'<br/></span>';
	}	
	out += "</div>";
	out += '</br>';
	return out;
}

LocationView = Backbone.View.extend({
	events: {
		'click': 'showLocation'
	},
	showLocation: function(){
		$('.aLocation').addClass('lessInfo');
		this.$el.removeClass('lessInfo');
		map.panTo( this.model.get('LatLng') );
		$('.listOfLocations').animate({ scrollTop: this.$el.offset().top });
	},
	render: function(){
		theHtml = templateLocationForList( this.model );
		var foo = $('.listOfLocations').append( theHtml );
		$('.aLocation').addClass('lessInfo');
		this.$el = $('.aLocation[data-id='+this.model.id+']');
		this.delegateEvents();
		var that = this;
		theLocation = this.model.get('locations') + " San Francisco";
		geocoder.geocode({ address: theLocation }, function(results, status){
			theLatLng = results[0].geometry.location; 
			that.model.set('LatLng', theLatLng);
			markerTitle = that.model.get('title') + ' ' + that.model.id;
			newMarker = new google.maps.Marker({
				position: theLatLng,
				map: map,
				title: markerTitle
			});
			google.maps.event.addListener(newMarker, 'click', function(){
				that.showLocation();
				$('.listOfLocations').animate({ scrollTop: that.$el.offset().top });
			});
			markerArray.push( newMarker );

		});
		return this;
	}
});
Location = Backbone.Model.extend({
	initialize: function(){
		//!!! this.LatLng =  __geolocate( this.location )__;
		
		// maybe add bounds to the request?
		// maybe add a region to the request?
		var that = this;
		this.view = new LocationView({model: this});
	}
});

function theFunctionWhenALocationIsclicked(){
	allLocations.shrink();// shrink will empty all the htmls and replace them with a look "less info"
	//!!! thislocation.html( something that looks cooler"(more info)" );
	map.panTo(this.LatLng);
}

Locations = Backbone.Collection.extend({
	model: Location,
	url: '/locationsOfMovie',
	display: function(){
		this.each( function(aLocation){
			// OK, I am not exactly sure which method should be used to display the locations list!
			// I will be calling the render function of each view created by each location.
			// I know there might be better ways, but I better have everything broken down into simple actions. 
			aLocation.view.render();
		});	
	}
});
Movie = Backbone.Model.extend({
	initialize: function(){
		this.locations = new Locations();
	},

});
Movies = Backbone.Collection.extend({});

var selectedMovie;
function ONSEARCHCONFIRMED(){
selectedMovie = "the selected movie";
// change URL to another route: movieSelected
}

SearchResults = Backbone.Collection.extend({
	model: SearchResult,
	url: '/search',
	render: function(){
		$('.searchResults').empty();
		for(var i=0; i< this.length; i++){
			this.models[i].render();
		}
	}
});

AllTitles = Backbone.Collection.extend({
	model: SearchResult,
	url: '/allTitles',
});
theAllTitles = new AllTitles();
theAllTitles.fetch({
	reset:true,
	success: function(){
		listOfUniqueTitles = [];
		console.log('got the results');
		theAllTitles.each( function(aSearchResult){
			listOfUniqueTitles.push( aSearchResult.get('title') );
		});
		$('.searchBox').autocomplete("option", "source", listOfUniqueTitles);
	},
	error: function(){
		console.log('something bad happened');
	}
});

function removeAllMarkers(){
for(i=0; i< markerArray.length; i++){
	markerArray[i].setMap(null) ;
}
markerArray = [];
}

// var selectedItem; => selectedMovie
Router = Backbone.Router.extend({
	routes: {
		'': 'home',	   
		'movie/:title': 'showMovieLocations'
	},
	showMovieLocations: function(title){
		removeAllMarkers();
		console.log('the title is: ' + title);
		// clear search view
		// initiate locations view
		theLocationsList = new Locations();
		theLocationsList.fetch({reset: true, data:{'q': title }, success: function(){
			$('.listOfLocations').empty();
			theLocationsList.display();
		}});
	},
	home: function(){

		removeAllMarkers();

		theRandomMovies = new Locations();
		theRandomMovies.url = '/locationsOfRandomMovies'
		theRandomMovies.fetch({
			reset:true,
			success: function(){
				$('.listOfLocations').empty();
				theRandomMovies.each( function(model){

					var persist = theRandomMovies.find( function( aRandomMovie ){
						return model.get('locations') == aRandomMovie.get('locations'); 
					});	
					if(persist != null && persist != model){
						debugger;
						persist.set({title: persist.get('title') +" &\n "+ model.get('title') });
						theRandomMovies.remove( model );
					}
				});
				theRandomMovies.display();
			},
			error: function(){
				console.log('something bad happened with the random movies');
			}
		});
	}
});
var myRouter = new Router();
/*
myRouter.on('route:home', function(){
// TODO do nothing?
});
myRouter.on('route:showMovieLocations', function(title){
	console.l});
*/
Backbone.history.start();
var mainPage = new Router();
var theSearchResults = new SearchResults();
