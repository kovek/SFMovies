# SF Movies
	A small app to find where in san-francisco have some movies been filmed.
	Demo: calm-journey-7595.herokuapp.com
	
## Choices

### Back-end

Since most of Uber’s back-end is in Python, I decided to go with that, as I’ll have to work with it later on no matter what.
I am given the possibility to use a web framework, but since there is a suggested microframework by Uber, I’ll go with it(Flask).
I wanted to check out Flask and compare it to other microframeworks but when I realized how similar it is to Laravel and how practical it is, I decided to stick with it.

### Front-end

Since Backbone.js is the recommended MVC, I will stick with that. Again, I might need to know how to use it since it might appear in Uber’s code.

---

I had no experience with both of them, so I had to read up on Flask on Flask's website and read up on Backbone.js in many different sources.
Backbone's structure was not intuitive at first, but it turned out to be very powerful, as it helps organize your code and makes the interactions with the webpage and the server easier. For example, each movie had its model and its own view which could easily rendered in the list.
Both Flask and Backbone were fun to learn. They both work very well RESTfully and, thus, together.

## What's missing & Trade offs

I thought that because it was more or less a static database, there would be no need in an id column, but then I realized backbone fetches better when it has an id to refer to. So, if I had more time, I would have added an id column.

The page's design could be better. Right now, I only have a list of things without any kind of styling. This could be improved by adding some colors, some nice transitions, etc. I've put my effort to make it clear to the user what he is looking at. When he hovers a location in the list, the according marker "lights" up; when he hovers a marker, the according location in the list gets highlighted.

Currently, because the markers take so long to load, I've added a small loading gif taken from http://www.ajaxload.info/. This could be prevented by pre-rendering the markers(or part of thereof) for the users on the server. 

For some reason, there are markers outside of the surrounding area of San-Francisco. This should've not happened, because when I requested the geolocations from Google, I appended " San Francisco" to each address. This issue could be investigated and fixed without too much work.

Obviously, there are going to be more movies filmed in San Francisco, so the database should be updated. To do so, I would've written a small cronjob file that would check https://data.sfgov.org/Arts-Culture-and-Recreation-/Film-Locations-in-San-Francisco/yitu-d5am and update the database accordingly.

An imporvement that could be made in the app would be to have the markers which represent multiples movies have a title as a list of those movies names. For example, there were many movies filmed on the Golden Gate Bridge. So, the title of the marker on the GGB could be all of those movies' names.

If I would've had more time, I would've filtered out the data which was undefined by the SF film locations database. For example, sometimes there are no second or third actors.

For all of the movies which have a location that points to nowhere, as defined by the database, I just put a marker to where the geocoder identifies as "San Francisco"

Bug: There are small errors that get logged in the console. Those are not coming from my code and do not affect the app. Still, there should naturally be something done about them if possible.

## Other goodies

I'm working on another project right now which I plan to release during the following month. It is related to road maintenance. I've included some description in my resume.

## The howtos

To get the server runnning:
$/var/www/uberProject/: . venv/bin/activate
$/var/www/uberProject/: python main.py

I made three simple proof of concept tests for the back-end
To test main.py, just run: $ python maintests.py

### GET Requests

To get information on a specific title, query
	/movieInfo?q=[movie title]

To get the locations of a specific movie, query
	/movieLocations?q=[movie title]

To get all of the movies, query 
	/allTitles

To search for a movie, query 
	/searchTitles?q=[query]

### The Database

Steps I've taken to generate the database:
1. Download the xml file from: https://data.sfgov.org/Arts-Culture-and-Recreation-/Film-Locations-in-San-Francisco/yitu-d5am
2. Download this xmltosqlite converter: https://gist.github.com/roder/743047
3. Run $/var/www/uberProjectHeroku/: python xmltosqlite.py . 
4. $: sqlite3 xmlsqlite.db3 
5. 	>alter table main.row add 'lat' REAL;
6. 	>alter table main.row add 'lon' REAL;
7. Then, I wrote a small file which geolocates all of the addresses and inputs them into the database: $: geolocate.py
Note: I appended "San Francisco" to all of the addresses. This means that all of the movies that have "None" as location will have a marker just in the middle of San Francisco. Also, for some reason, google returned a latlon which is not in San Francisco. This small issue should be investigated quickly, as it is not supposed to happen
Note: For some locations(about 10 of them), google did not return anything, I don't really know why, since I appended "San Francisco". This is why when one of those locations gets clicked on, the google map glitches.
Note: If I would've had more time, I would have added an id column to the database to make the backbone fetching simpler.

