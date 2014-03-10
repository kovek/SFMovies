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
		rv = self.app.get('/infoOnTitle?q=Can%27t+Stop+the+Music')
		print 'A'
		print rv.data
		print 'A'
		assert 'e", "director": "Nancy Walker", "production_company": "EMI Films", "distributor": "Associated Film Distribution (AFD)", "lat": "-122.4036728", "lon": "37.7678455"}' in rv.data

	def test_location_json(self):
		rv = self.app.get('/locationsOfMovie?q=Can%27t+Stop+the+Music')
		assert " " in rv.data

if __name__ == '__main__':
	unittest.main()
