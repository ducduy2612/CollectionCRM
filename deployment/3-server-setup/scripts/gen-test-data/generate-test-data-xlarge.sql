-- XLarge scale data generation (1M customers, 3M loans)
SET myapp.scale = 'xlarge';
\i /scripts/generate-test-data.sql