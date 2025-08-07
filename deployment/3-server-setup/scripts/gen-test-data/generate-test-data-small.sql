-- Small scale data generation (1K customers, 3K loans)
SET myapp.scale = 'small';
\i /scripts/generate-test-data.sql