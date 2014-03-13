import os
import json
import sqlite3
import requests
path = os.path.join('/home/kevin/uberProjectHeroku/xmlsqlite.db3')
rv = sqlite3.connect(path)
rv.row_factory = sqlite3.Row

results = rv.execute('select * from row where lat is null;')
entries = results.fetchall()
for entry in entries:
	address = address2 = entry['locations']
	if not address or address is "":
		address = address2 = ""
		query = 'update row set lat=37.774929, lon=-122.419416 where lat is null and locations is null ;'
		print query
		results = rv.execute(query)
		rv.commit()
		continue
	address = address + " San Francisco"
	address.replace("'", "%27").replace(" ", "+")
	r = requests.get('https://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + address)
	theJson = r.json()
	if len(theJson['results']) is 0:
		print 'google did not geolocate: ' + address2
		continue
	lat = theJson['results'][0]['geometry']['location']['lat']
	lon = theJson['results'][0]['geometry']['location']['lng']

	# Added "lat is null" because had to do update table in two runs... because google did not want to geolocate anymore
	query = 'update row set lat='+str(lat)+', lon='+str(lon)+' where lat is null and locations="'+address2+'" ;'
	print query
	results = rv.execute(query)
	rv.commit()

rv.close()

