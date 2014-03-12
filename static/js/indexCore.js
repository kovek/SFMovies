var map;
var markerArray = [];
var listOfUniqueTitles = [];
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
	google.maps.event.addListener(map, 'bounds_changed', googlemapsLoaded() );
}
google.maps.event.addDomListener(window, 'load', initialize);


function removeLoading(){
// Remove the loading layer
	$('.loadingDiv').addClass('hidden');
}

function removeAllMarkers(){
// Remove all of the google map markers
	for(i=0; i< markerArray.length; i++){
		markerArray[i].setMap(null) ;
	}
	markerArray = [];
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

// This variable will be incremented until it reaches the number of locations on the server.
// When it reaches that amount, the loading is removed
var numberOfRenderedLocations = 0;

function googlemapsLoaded(){
// We need this method because unless the map is loaded, we cannot add any markers to it.
	$('.searchBox').autocomplete({
		source: listOfUniqueTitles 
		// Remark: The source is empty at first.
		// It is modified when all of the titles are fetched from the server.
	});
	$('.searchBox').on('autocompleteselect', function(event, ui){
		router.navigate('movie/'+encodeURI(ui.item.value), {trigger: true});
		// For a prettier url, instead of using encodeURI, change spaces for -dashes
	});

	SearchResult = Backbone.Model.extend({});

	LocationView = Backbone.View.extend({
		events: {
			'mouseup': 'showLocation',
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
			// Scroll to this location and pan to its corresponding marker
			e.stopImmediatePropagation();
			e.stopPropagation();
			$('.listOfLocations').animate({ scrollTop: this.$el.offset().top + this.$el.parents('.listOfLocations').scrollTop() - 30  });
			$('.aLocation.moreInfo').removeClass('moreInfo');
			this.$el.addClass('moreInfo');
			map.panTo( this.model.get('LatLng') );
		},
		templateLocationForList: function( t ){
			// The html of the location view
			out = "<div data-id=l"+t.id+" class='aLocation'>";
			out += '<span class="location">'+t.get('locations')+'</span>';
			out += "</div>";
			return out;
		},
		render: function(){
			// Render the location under the title in the list and on the map.
			var theHtml = this.templateLocationForList( this.model );
			var movieEl = $('.listOfLocations .aMovie[data-title="'+this.model.get('movie').get('title')+'"]');
			movieEl.find('.theLocations').append( theHtml );
			this.$el = movieEl.find('.aLocation[data-id=l'+this.model.id+']');
			this.delegateEvents();
			this.createMarker();
			numberOfRenderedLocations++;
			if( numberOfRenderedLocations > 889 ){ // 889 is the number of rows found by doing select count(*) from row in the database - 2
				allMoviesLoaded=true;
				router.showMovieLocations();
				removeLoading();
			}
			return this;
		},
		createMarker: function(){
			var lat = parseFloat( this.model.get('lat') );
			var lon = parseFloat( this.model.get('lon') );
			var that = this;
			var latLng = new google.maps.LatLng( lat, lon ); 
			that.model.set('LatLng', latLng);

			var movieTitle = this.model.get('movie').get('title')
			var markerTitle = movieTitle + ' ' + that.model.id;
			newMarker = new google.maps.Marker({
				position: latLng,
				map: map,
				title: markerTitle,
				icon: 'static/images/video1.png'
			});
			google.maps.event.addListener(newMarker, 'click', function(){
				if( $('.aMovie.moreInfo').length == 0 ){
					$('.aMovie[data-title="'+that.model.get('movie').get('title')+'"] .theTitle').mouseup();

					that.$el.mouseup();
					// This should be in the callback of the mouseup() of movie item to make sure this one is called after the previous one
					// For some reason, having this call in the callback did not work...
				}else{
					that.$el.mouseup();
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
			this.view = new LocationView({model: this});
		}
	});

	Locations = Backbone.Collection.extend({
		model: Location,
		url: '/locationsOfMovie',
		
		display: function(){
			var that = this;
			this.each( function(aLocation){
				aLocation.view.render();
			});	
		}
	});
	Movie = Backbone.Model.extend({
		url: '/movieInfo',
		initialize: function(){
			this.fetch({
				data:{
					'q': this.get('title')
				},
				success: function(model, response, options){
					var movieView = new MovieView({model: model});
					movieView.render();

					model.locations = new Locations();
					model.locations.url = '/movieLocations';
					model.locations.fetch({reset:true, // Fetch the locations of that movie
						data: {'q': model.get('title') },
						parentModel: model, // We pass model to parentModel to then set the locations' "movie" property as model
						success: function(collection, response, options){
							collection.each( function(locationModel){ locationModel.set('movie', options.parentModel); locationModel.view.render(); });
						}
					});
				}
			});
		},

	});
	MovieView = Backbone.View.extend({
		events:{
			'mouseup .theTitle': 'choseMovie'
		},
		render: function(){
			$('.listOfLocations').append( this.templateOfMovie(this.model) );		

			// Link the movie view to its dom element and delegate the appropriate events
			this.$el = $('.aMovie[data-title="'+this.model.get('title')+'"]'); 
			this.delegateEvents();
		},
		templateOfMovie: function( t ){
			// The html of the movie view
			var out = "<div data-id="+t.id+" class='aMovie ' data-title=\""+t.get('title')+"\">";
			at = t.attributes;
			out += '<span class="theTitle">'+at['title']+'<br/></span>';
			out += '<div class="extra">';
			for(a in at){
				out += '<span class='+a+'><span class="st">'+userify(a)+':</span><div class="bt">'+at[a]+'</div></span>';
			}	
			out += "<div class='theLocations'><span class='st'>Locations:</span></div>";
			out += '</div>';
			out += "</div>";
			return out;
		},
		choseMovie: function(){
			$('.aMovie.moreInfo').removeClass('moreInfo');
			if ( this.model.get('title') != $('.moreInfo.aMovie').data('title') ){
				$('.listOfLocations').animate({ scrollTop: this.$el.offset().top + this.$el.parents('.listOfLocations').scrollTop() - 30  });
			}
			router.navigate('movie/'+encodeURI(this.model.get('title')), {trigger:false});

			this.$el.addClass('moreInfo');
			for(var i = 0; i < markerArray.length; i++){
				markerArray[i].setVisible(false);
			}
			this.model.locations.each( function(model){
				var theMarker = model.get('myMarker');
				if(theMarker == null){
					// Since all of the markers have been loaded on page load, this block should never be reached 
					// I'm leaving this here in case someone decides to remove the markers' render on page load
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
	});
	allTitles = new SearchResults();
	allTitles.url = '/allTitles';
	allTitles.fetch({
		reset:true,
		success: function(){ // Unsure if I should do function(model){ or just access the model with allTitles. The second one seems clearer
			listOfUniqueTitles = [];
			allTitles.each( function(aSearchResult){
				listOfUniqueTitles.push( aSearchResult.get('title') );
			});
			$('.searchBox').autocomplete("option", "source", listOfUniqueTitles);
		},
		error: function(){
			console.log('something bad happened relative to the server and /allTitles');
		}
	});

	var allMoviesLoaded = false,
	Router = Backbone.Router.extend({
		routes: {
			'': 'all',
			'random': 'random',	   
			'movie/:0title': 'setMovieName'
		},
		setMovieName: function(title){
			this.title = title;
			this.all();
		},
		showMovieLocations: function(){
			$('.listOfLocations .aMovie[data-title="'+this.title+'"] .theTitle').mouseup();
		},
		random: function(){ // Little feature to let the user discover new movies/locations.
			removeAllMarkers();
			var randomMoviesLocations = new Locations();
			randomMoviesLocations.url = '/locationsOfRandomMovies'
			randomMoviesLocations.fetch({
				reset:true,
				success: function(){
					$('.listOfLocations').empty();
					randomMoviesLocations.each( function(model){
						var persist = randomMoviesLocations.find( function( aRandomMovie ){
							return model.get('locations') == aRandomMovie.get('locations'); 
						});	
						if(persist != null && persist != model){
							persist.set({title: persist.get('title') +" &\n "+ model.get('title') });
							randomMoviesLocations.remove( model );
						}
					});
					randomMoviesLocations.display();
				},
			});
		},
		all: function(){
			$('.moreInfo').removeClass('moreInfo');
			if( !allMoviesLoaded ){
				// The movies are not appearing in the list yet, so that's we'll do first.
				removeAllMarkers(); // Just a measure of precaution, should not be mandatory
				var allMovies = new Movies();
				allMovies.url = '/allTitles';
				allMovies.fetch();
			}else{
				for(var i = 0; i < markerArray.length; i++){
					markerArray[i].setVisible(true);
				}
				$('.listOfLocations .aMovie[data-title="'+this.title+'"] .theTitle').mouseup();
			}
		},
	});
	var router = new Router();
	Backbone.history.start();
}
