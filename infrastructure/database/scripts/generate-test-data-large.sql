-- Large scale data generation (100K customers, 300K loans)
SET myapp.scale = 'large';
\i /scripts/generate-test-data.sql