import os # for the sqlite3 database file
import random
import json
import sqlite3
from flask import Flask, render_template, g, request, Response
app = Flask(__name__)
app.config.from_object(__name__)
app.config.update( dict(
	DATABASE=os.path.join(app.root_path, 'xmlsqlite.db3'),
))

# This function is meant to concatenate a JSON response from what sqlite3 returns.
def formatSqliteForJSON( entries ):
	out = '['
	i = 0
	for item in entries:
		if i!=0: out += ", "
		out += '{'
		out += '"id": "'+str(i)+'"' # Because the database is missing ids. 
		for j in range( len(item) ):
			if item[j]:
				if type(item[j]) is float:
					theItem = str( item[j] )		
				else:
					theItem = item[j].encode('utf-8')
			else:
				theItem = item[j]
			out += ', "'+item.keys()[j]+'": '+json.dumps(str( theItem ))
		out += '}'
		i += 1
	out += ']'     
	return out

@app.route('/')
def mainPage():
# Render the main page
	return render_template('index.html')

@app.route('/allTitles', methods=['GET'])
def allTitles():
# Return all titles in the database
	db = getDb()
	results = db.execute('select distinct title from row where 1 group by title;')
	entries = results.fetchall() # TODO
	out = formatSqliteForJSON( entries )
	return Response(out, mimetype="application/json")

@app.route('/searchTitles', methods=['GET'])
def searchTitle():
# This page returns a JSON string of all the movie titles which resemble what the user typed in
	query = str(request.args.get('q'))
	db = getDb()
	results = db.execute('select title from row where title like "%'+query+'%";') 
	entries = results.fetchall()
	out = formatSqliteForJSON( entries )
	return Response(out, mimetype="application/json")

@app.route('/movieInfo', methods=['GET'])
def infoOnTitle():
	query = str(request.args.get('q'))
	db = getDb()
	dbQuery = 'select title, release_year, fun_facts, writer, actor_1, actor_3, actor_2, director, production_company, distributor from row where title="'+query+'" limit 1;'
	results = db.execute(dbQuery) # TODO or should we change %like% to %like. ? 
	entries = results.fetchall() # TODO
	out = formatSqliteForJSON( entries )
	out = out[1:len(out)-1]
	return Response(out, mimetype="application/json")

@app.route('/movieLocations', methods=['GET'])
def searchMovieLocations():
	query = str(request.args.get('q'))
	db = getDb()
	results = db.execute('select locations, lat, lon from row where title = "'+query+'";')
	entries = results.fetchall()
	out = formatSqliteForJSON( entries )
	return Response(out, mimetype="application/json")
	
@app.route('/locationsOfRandomMovies', methods=['GET'])
def randomMovieLocations():
	query = str(request.args.get('boundaries'))
	db = getDb()
	print query
	results = db.execute('select * from row where 1;')
	entries = results.fetchall()
	for entry in entries:
		x = random.randint(1,3)
		if x/3 == 0:
			entries.remove(entry)
	random.shuffle(entries)
	entries = entries[0:5]
	out = formatSqliteForJSON( entries )
	return Response(out, mimetype="application/json")

def initDb():
	with app.app_context():
		db = getDb()
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()
	
def connectDb():
# This function connects us to the sqlite3
	rv = sqlite3.connect(app.config['DATABASE'])
	rv.row_factory = sqlite3.Row
	return rv

def getDb():
# If we don't have a db variable, make one
	if not hasattr(g, 'sqliteDb'):
		g.sqliteDb = connectDb()
	return g.sqliteDb

@app.teardown_appcontext
def closeDb(error):
# When the request ends, close the db connection
	if hasattr(g, 'sqliteDb'):
		g.sqliteDb.close()

if __name__ == '__main__':
	app.run(debug=True)
