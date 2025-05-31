#!/bin/bash
# From the root of this project:
supabase login
supabase link --project-ref hlkchedpyaffcyvoaxqe
supabase db reset --yes        # Resets the database (drops all tables)
supabase db script migrate.sql  # If you need a combined SQL; else run each file below
psql "$SUPABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql "$SUPABASE_URL" < backend/app/db/001_create_core_tables.sql
psql "$SUPABASE_URL" < backend/app/db/002_rls_policies.sql
psql "$SUPABASE_URL" < backend/app/db/003_seed_data.sql
