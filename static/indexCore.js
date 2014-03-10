var map;
var markerArray = [];
function initialize(){
	var mapOptions = {
		center: new google.maps.LatLng(37.774929, -122.419416),
		zoom: 12,
		mapTypeControl: true,
		mapTypeControlOptions: {
			position: google.maps.ControlPosition.BOTTOM_LEFT
		}
	};
	map = new google.maps.Map( document.getElementById('mapCanvas'), mapOptions);
}
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
	return lessInfo( ['title', 'release_year', 'fun_facts', 'actor_1', 'actor_2', 'actor_3', 'production_company', 'director', 'locations', 'writer', 'distributor'] );
}

function userify( word ){ // Return prettier words for the user to read. ex: actor_1 -> First actor
	return dictionary[word] != undefined ? dictionary[word] : word;	
} var dictionary = {
	"title":"Title",
	"release_year": "Release Year",
	"production_company": "Production Company",
	"director":"Director",
	"actor_1": "Actors",
	"actor_2":"Second actor",
	"actor_3":"Third actor",
	"locations": "Locations",
	"distributor": "Distributor",
	"writer":"Writer"};

function templateLocationForList( t ){
	out = "<div data-id=l"+t.id+" class='aLocation'>";
	out += '<span class="location"><div class="locationIcon">L</div> '+t.get('locations')+'</span>';
	out += "</div>";
	return out;
}

LocationView = Backbone.View.extend({
	events: {
		'mousedown': 'showLocation',
		'mouseenter': 'highlightMarker',
		'mouseleave': 'unHighlightMarker'
	},
	highlightMarker: function(e){
		this.model.get('myMarker').setIcon('static/images/video2.png');
	},
	unHighlightMarker: function(e){
		this.model.get('myMarker').setIcon('static/images/video1.png');
	},
	showLocation: function(e){
		e.stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
		$('.listOfLocations').animate({ scrollTop: this.$el.offset().top + this.$el.parents('.listOfLocations').scrollTop() - 30  }); // TODO remove -10
		console.log('he clicked me');
		$('.aLocation').addClass('lessInfo');
		$('.aLocation.moreInfo').removeClass('moreInfo');
		this.$el.removeClass('lessInfo');
		this.$el.addClass('moreInfo');
		map.panTo( this.model.get('LatLng') );
		//$('.listOfLocations').animate({ scrollTop: this.$el.offset().top });
	},
	render: function(){
		theHtml = templateLocationForList( this.model );
		var movieEl = $('.listOfLocations .aMovie[data-name="'+this.model.get('title')+'"]');

		movieEl.find('.theLocations').append( theHtml );

		this.$el = movieEl.find('.aLocation[data-id=l'+this.model.id+']');
		this.delegateEvents();
		allMoviesLoaded=true;
		this.createMarker();
		return this;
	},
	createMarker: function(){
		theLocation = this.model.get('locations') + " San Francisco";
		lat = this.model.get('lat');
		lat = parseFloat( lat );
		lon = this.model.get('lon');
		lon = parseFloat( lon );
		var that = this;
		theLatLng = new google.maps.LatLng( lon, lat ); 
		that.model.set('LatLng', theLatLng);
		markerTitle = that.model.get('title') + ' ' + that.model.id;
		newMarker = new google.maps.Marker({
			position: theLatLng,
			map: map,
			title: markerTitle
		});
		google.maps.event.addListener(newMarker, 'click', function(){
			if( $('.aMovie.moreInfo').length == 0 ){
				theTitle = that.model.get('title');		
				$('.aMovie[data-name="'+theTitle+'"]').mousedown(function(){
					that.$el.mousedown();
				});
			}else{
				that.$el.mousedown();
			}
		});
		google.maps.event.addListener(newMarker, 'mouseover', function(){
			that.$el.addClass('markerHovered');
		});
		google.maps.event.addListener(newMarker, 'mouseout', function(){
			that.$el.removeClass('markerHovered');
		});
		markerArray.push( newMarker );
		that.model.set({myMarker: newMarker});
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
		var that = this;
		this.each( function(aLocation){
			// OK, I am not exactly sure which method should be used to display the locations list!
			// I will be calling the render function of each view created by each location.
			// I know there might be better ways, but I better have everything broken down into simple actions. 
			aLocation.view.set({parent: this.get('parent') });
			aLocation.set({parent: this.get('parent') });
			aLocation.view.render();
		});	
	}
});
Movie = Backbone.Model.extend({
	that: null,
	url: 'infoOnTitle',
	initialize: function(){
		that = this;
		this.fetch({
			data:{
				'q': this.get('title')
			},
			success: function(model, response, options){
				aMovieView = new MovieView({model: model});
				aMovieView.render();

				theTitle = model.get('title');
				model.locations = new Locations();
				model.locations.url = '/locationsOfMovie';
				model.locations.set({parent: model.get('title')});
				model.locations.fetch({reset:true,
					data: {'q': model.get('title') },
					success: function(collection, response, options){
						collection.each( function(model){ model.view.render(); });
						
						aMovieView.$el = $(".aMovie[data-name='"+aMovieView.model.get('title')+"'] .title");	
						aMovieView.delegateEvents();
					}
				});
			}
		});
	},

});
MovieView = Backbone.View.extend({
	initialize: function(){
	
	},
	events:{
		'mousedown': 'choseMovie'
	},
	render: function(){
		$('.listOfLocations').append( this.templateOfMovie(this.model) );		
		this.$el = $('.aMovie[data-name="'+this.model.get('title')+'"]'); 
		this.delegateEvents();
	},
	templateOfMovie: function( t ){
		out = "<div data-id="+t.id+" class='aMovie lessInfo' data-name=\""+t.get('title')+"\">";
		at = t.attributes;
		out += '<span class="theTitle">'+at['title']+'<br/></span>';
		out += '<div class="extra">';
		for(a in at){
			out += '<span class='+a+'><span class="st">'+userify(a)+':</span><div class="bt">'+at[a]+'</div></span>';
		}	
		out += "<div class='theLocations'></div>";
		out += '</div>';
		out += "</div>";
		return out;
	},
	choseMovie: function(){
		var theMovie = $('.aMovie[data-name="'+this.model.get('title')+'"]');
		$('.aMovie.moreInfo').removeClass('moreInfo');
		$('.listOfLocations .aMovie').addClass('lessInfo');	
		if ( this.$el.data('name') != $('.moreInfo.aMovie').data('name') ){
		$('.listOfLocations').animate({ scrollTop: theMovie.offset().top + theMovie.parents('.listOfLocations').scrollTop() - 30  }); // TODO remove -10
		}
		console.log('he clicked me, the movie');
		myRouter.navigate('movie/'+this.model.get('title'), {trigger:true});

		theMovie.removeClass('lessInfo');
		theMovie.addClass('moreInfo');
		for(var i = 0; i < markerArray.length; i++){
			markerArray[i].setVisible(false);
		}
		this.model.locations.each( function(model){
			theMarker = model.get('myMarker');
			if(theMarker == null){
				model.view.createMarker();
			}else{
				theMarker.setVisible(true);
			}
		});
	}
});


Movies = Backbone.Collection.extend({
	model: Movie
});


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
var allMoviesLoaded = false,
Router = Backbone.Router.extend({
	routes: {
		'': 'all',
		'random': 'random',	   
		'movie/:title': 'showMovieLocations'
	},
	showMovieLocations: function(title){
		/*
		removeAllMarkers();
		console.log('the title is: ' + title);
		// clear search view
		// initiate locations view
		theLocationsList = new Locations();
		theLocationsList.fetch({reset: true, data:{'q': title }, success: function(){
			$('.listOfLocations').empty();
			theLocationsList.display();
		}});
		*/
		if(allMoviesLoaded == false){
			this.all();	
			window.setTimeout( function(){
				$('.listOfLocations .aMovie[data-name="'+title+'"]').mousedown();
		   	}, 10000);
		}else{
			$('.listOfLocations .aMovie[data-name="'+title+'"]').mousedown();
		}
	},
	random: function(){

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
	},
	all: function(){

		
		$('.moreInfo').addClass('lessInfo').removeClass('moreInfo');
		if( !allMoviesLoaded ){
			removeAllMarkers();
			allMovies = new Movies();
			allMovies.url = '/allTitles';
			allMovies.fetch();
		}else{
			for(var i = 0; i < markerArray.length; i++){
				markerArray[i].setVisible(true);
			}
		}
	}
});
var myRouter = new Router();
Backbone.history.start();
var mainPage = new Router();
var theSearchResults = new SearchResults();
