drop table if exists 'row';
CREATE TABLE 'row' ( 
  'release_year' TEXT,
  'title' TEXT,
  'fun_facts' TEXT,
  'writer' TEXT,
  'actor_1' TEXT,
  'locations' TEXT,
  'actor_3' TEXT,
  'actor_2' TEXT,
  'director' TEXT,
  'production_company' TEXT,
  'distributor' TEXT
, 'lon' REAL, 'lat' REAL);


INSERT INTO row VALUES('1980','Can''t Stop the Music',NULL,'Allan Carr',NULL,'101 Henry Adams Place',NULL,NULL,'Nancy Walker','EMI Films','Associated Film Distribution (AFD)',-122.4036728,37.7678455);
