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
	google.maps.event.addListener(map, 'bounds_changed', googlemapsLoaded() );
}
google.maps.event.addDomListener(window, 'load', initialize);

listOfUniqueTitles = [];
//TODO

function removeAllMarkers(){
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


var numberOfRenderedLocations = 0;
function googlemapsLoaded(){
	$('.searchBox').autocomplete({
		source: listOfUniqueTitles
	});
	$('.searchBox').on('autocompleteselect', function(event, ui){
		Backbone.history.fragment = null;
		myRouter.navigate('movie/'+encodeURI(ui.item.value), {trigger: true}); // TODO instead of encodeURI, change spaces for -dashes?
	});

	SearchResult = Backbone.Model.extend({
		initialize: function(){

		},
		render: function(){
			$('.searchResults').append('<li class=".'+this.get('title')+'">'+this.get('title')+'</li>');	
		}
	});




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
		templateLocationForList: function( t ){
			out = "<div data-id=l"+t.id+" class='aLocation'>";
			out += '<span class="location">'+t.get('locations')+'</span>';
			out += "</div>";
			return out;
		},
		render: function(){
			theHtml = this.templateLocationForList( this.model );
			var movieEl = $('.listOfLocations .aMovie[data-name="'+this.model.get('movie').get('title')+'"]');
			movieEl.find('.theLocations').append( theHtml );
			this.$el = movieEl.find('.aLocation[data-id=l'+this.model.id+']');
			this.delegateEvents();
			//myRouter.selectMovie();
			this.createMarker();
			numberOfRenderedLocations++;
			if( numberOfRenderedLocations > 889 ){ // number of rows found by doing select count(*) from row - 2
				allMoviesLoaded=true;
				myRouter.showMovieLocations();
			}
			return this;
		},
		createMarker: function(){
			lat = this.model.get('lat');
			lat = parseFloat( lat );
			lon = this.model.get('lon');
			lon = parseFloat( lon );
			var that = this;
			theLatLng = new google.maps.LatLng( lat, lon ); 
			that.model.set('LatLng', theLatLng);
			if(	movieTitle = that.model.get('movie') == undefined ){
				debugger;
			}
			movieTitle = this.model.get('movie').get('title')
			markerTitle = movieTitle + ' ' + that.model.id;
			newMarker = new google.maps.Marker({
				position: theLatLng,
				map: map,
				title: markerTitle,
				icon: 'static/images/video1.png'
			});
			google.maps.event.addListener(newMarker, 'click', function(){
				if( $('.aMovie.moreInfo').length == 0 ){
					$('.aMovie[data-name="'+that.model.get('movie').get('title')+'"] .theTitle').mousedown();
						//function(){
						that.$el.mousedown();
					//})
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
			var that = this;
			this.view = new LocationView({model: this});
		}
	});

	Locations = Backbone.Collection.extend({
		model: Location,
		url: '/locationsOfMovie',
		
		display: function(){
			var that = this;
			this.each( function(aLocation){
				// I am not exactly sure which method should be used to display the locations list!
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
					parentModel = model;
					model.locations = new Locations();
					model.locations.url = '/locationsOfMovie';
					model.locations.set({parent: theTitle});
					model.locations.fetch({reset:true,
						data: {'q': model.get('title') },
						parentModel: parentModel,
						success: function(collection, response, options){
							collection.each( function(model){ model.set('movie', options.parentModel); model.view.render(); });
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
			'mousedown .theTitle': 'choseMovie'
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
			out += "<div class='theLocations'><span class='st'>Locations:</span></div>";
			out += '</div>';
			out += "</div>";
			return out;
		},
		choseMovie: function(){
			var theMovie = $('.aMovie[data-name="'+this.model.get('title')+'"]');
			$('.aMovie.moreInfo').removeClass('moreInfo');
			$('.listOfLocations .aMovie').addClass('lessInfo');	
			if ( this.model.get('title') != $('.moreInfo.aMovie').data('name') ){
			$('.listOfLocations').animate({ scrollTop: theMovie.offset().top + theMovie.parents('.listOfLocations').scrollTop() - 30  }); // TODO remove -10
			}
			console.log('he clicked me, the movie');
			myRouter.navigate('movie/'+encodeURI(this.model.get('title')), {trigger:false});

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
			console.log('something bad happened relative to /allTitles');
		}
	});



	// var selectedItem; => selectedMovie
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
			$('.listOfLocations .aMovie[data-name="'+this.title+'"] .theTitle').mousedown();
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
				$('.listOfLocations .aMovie[data-name="'+this.title+'"] .theTitle').mousedown();
			}
		},
		selectMovie: function(){
		
		}
	});
	var myRouter = new Router();
	Backbone.history.start();
	var mainPage = new Router();
}
