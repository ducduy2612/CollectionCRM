# ETL Directory

This directory contains Extract, Transform, Load (ETL) processes for the Collexis system.

## Purpose

The ETL processes are responsible for:
- Extracting data from external systems (T24 Core Banking, W4 System, LOS System, etc.)
- Transforming data to match the Collexis data model
- Loading data into the Collexis database and search engine

## Components

- Data pipelines (NiFi/Airbyte)
- Data transformations
- Data validation rules
- Scheduling configuration
- Error handling mechanisms