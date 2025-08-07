-- Medium scale data generation (10K customers, 30K loans)
SET myapp.scale = 'medium';
\i /scripts/generate-test-data.sql