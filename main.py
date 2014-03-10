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


tableOrder = ["release_year", "title", "fun_facts", "writer", "actor_1", "locations", "actor_3", "actor_2", "director", "production_company", "distributor", "lat", "lon"]

#this function is meant to concatenate a JSON response from what sqlite3 returns.
#TODO must find an alternative
def formatSqliteForJSON( entries ):
	out = '['
	i = 0
	for item in entries:
		if i!=0: out += ", "
		out += '{'
		out += '"id": "'+str(i)+'"'
		for j in range(len([1])):
			#out += ', "'+tableOrder[j]+'": '+json.dumps(str(item[j].encode('utf-8') if item[j] else item[j] ))
			out += ', "title": '+json.dumps(str(item[j].encode('utf-8') if item[j] else item[j] ))
		out += '}'
		i += 1
	out += ']'
	return out

def formatSqliteForJSON2( entries ):
	out = '['
	i = 0
	for item in entries:
		if i!=0: out += ", "
		out += '{'
		out += '"id": "'+str(i)+'"'
		for j in range( len(tableOrder) ):
			if item[j]:
				if type(item[j]) is float:
					theItem = str( item[j] )		
				else:
					theItem = item[j].encode('utf-8')
			else:
				theItem = item[j]
			out += ', "'+tableOrder[j]+'": '+json.dumps(str( theItem ))
		out += '}'
		i += 1
	out += ']'
	return out

@app.route('/')
def mainPage():
#just render the main page
	return render_template('index.html')

@app.route('/allTitles', methods=['GET'])
def searchTitle():
#this page returns a JSON string of all the movie titles which resemble what the user typed in
	#Get the q argument in the url
	query = str(request.args.get('q'))
	db = getDb()
	#search the db
	results = db.execute('select distinct title from row where 1;') # TODO or should we change %like% to %like. ? 
	entries = results.fetchall() # TODO
	out = formatSqliteForJSON( entries )
	return Response(out, mimetype="application/json")

@app.route('/infoOnTitle', methods=['GET'])
def infoOnTitle():
	query = str(request.args.get('q'))
	db = getDb()
	#search the db
	dbQuery = 'select * from row where title="'+query+'" limit 1;'
	results = db.execute(dbQuery) # TODO or should we change %like% to %like. ? 
	entries = results.fetchall() # TODO
	out = formatSqliteForJSON2( entries )
	out = out[1:len(out)-1]
	return Response(out, mimetype="application/json")

@app.route('/locationsOfMovie', methods=['GET'])
def searchMovieLocations():
#this page returns a JSON string of all the movie titles which resemble what the user typed in
	#Get the q argument in the url
	query = str(request.args.get('q'))
	db = getDb()
	#search the db
	print query
	results = db.execute('select * from row where title = "'+query+'";')
	entries = results.fetchall() # TODO
	out = formatSqliteForJSON2( entries )
	return Response(out, mimetype="application/json")
	
@app.route('/locationsOfRandomMovies', methods=['GET'])
def randomMovieLocations():
#this page returns a JSON string of all the movie titles which resemble what the user typed in
	#Get the q argument in the url
	query = str(request.args.get('boundaries'))
	db = getDb()
	#search the db
	print query
	results = db.execute('select * from row where 1;')
	entries = results.fetchall() # TODO
	for entry in entries:
		x = random.randint(1,3)
		if x/3 == 0:
			entries.remove(entry)
	random.shuffle(entries)
	entries = entries[0:5]
	out = formatSqliteForJSON2( entries )
	return Response(out, mimetype="application/json")

def initDb():
	with app.app_context():
		db = getDb()
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()
	
def connectDb():
#this function connects us to the sqlite3
	rv = sqlite3.connect(app.config['DATABASE'])
	rv.row_factory = sqlite3.Row
	return rv

def getDb():
#if we don't have a db variable, make one
	if not hasattr(g, 'sqliteDb'):
		g.sqliteDb = connectDb()
	return g.sqliteDb

@app.teardown_appcontext
def closeDb(error):
#when the request ends, close the db connection
	if hasattr(g, 'sqliteDb'):
		g.sqliteDb.close()

if __name__ == '__main__':
	app.run(debug=True)
