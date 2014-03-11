To get the server runnning:
$/var/www/uberProject/: . venv/bin/activate
$/var/www/uberProject/: python main.py

Steps I've taken to generate the database:
1. Download the xml file from: https://data.sfgov.org/Arts-Culture-and-Recreation-/Film-Locations-in-San-Francisco/yitu-d5am
2. Download this xmltosqlite converter: https://gist.github.com/roder/743047 
3. Run $/var/www/uberProjectHeroku/: python xmltosqlite.py . 
4. $: sqlite3 xmlsqlite.db3 
5. 	>alter table main.row add 'lat' REAL;
6. 	>alter table main.row add 'lon' REAL;
7. Then, I wrote a small file which geolocates all of the addresses and inputs them into the database: $: geolocate.py
Note: I appended "San Francisco" to all of the addresses. This means that all of the movies that have "None" as location will have a marker just in the middle of San Francisco. Also, for some reason, google returned a latlon which is not in San Francisco. This small issue should be investigated quickly, as it is not supposed to happen
Note: For some locations(about 10 of them), google did not return anything, I don't really know why, since I appended "San Francisco". This is why when one of those locations gets clicked on, the google maps glitches.

I made three simple tests as a proof of concept for the back-end
To test main.py, just run: $ python main_tests.py

An imporvement that could be made in the app would be to have the markers which represent multiples movies have a title as a list of those movies names. For example, there were many movies filmed on the Golden Gate Bridge. So, the title of the marker on the GGB could be all of those movies' names.

If I would've had more time, I would've filtered out the data which was undefined by the SF database. For example, sometimes there are no second or third actors.
For all of the movies which have a location that points to nowhere, as defined by the database, I just put a marker to where the geocoder identifies as "San Francisco"
