import os
import main 
import unittest
import tempfile

class FlaskrTestCase(unittest.TestCase):

	def setUp(self):
		self.db_fd, main.app.config['DATABASE'] = tempfile.mkstemp()
		main.app.config['TESTING'] = True
		self.app = main.app.test_client()
		main.initDb()

	def tearDown(self):
		os.close(self.db_fd)
		os.unlink(main.app.config['DATABASE'])

	def test_home_page(self):
		rv = self.app.get('/')
		assert "<title>SF Movies</title>" in rv.data

	def test_movie_json(self):
		rv = self.app.get('/movieInfo?q=Can%27t+Stop+the+Music')
		assert '{"id": "0", "title": "Can\'t Stop the Music", "release_year": "1980", "fun_facts": "None", "writer": "Allan Carr", "actor_1": "None", "actor_3": "None", "actor_2": "None", "director": "Nancy Walker", "production_company": "EMI Films", "distributor": "Associated Film Distribution (AFD)"}' in rv.data

	def test_locations_json(self):
		rv = self.app.get('/movieLocations?q=Can%27t+Stop+the+Music')
		assert '[{"id": "0", "locations": "101 Henry Adams Place", "lat": "37.7678455", "lon": "-122.4036728"}]' in rv.data

if __name__ == '__main__':
	unittest.main()
