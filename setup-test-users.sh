#!/bin/bash

# Script to create test users in Supabase GoTrue
# This should be run after the services are started

SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"service_role_example_key"}
GOTRUE=${GOTRUE_URL:-"http://localhost:9999"}

echo "Creating test users..."

# Create test users
curl -X POST "$GOTRUE/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{"email":"test1@example.com","password":"123456","role":"authenticated"}'

curl -X POST "$GOTRUE/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{"email":"test2@example.com","password":"123456","role":"authenticated"}'

curl -X POST "$GOTRUE/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{"email":"test3@example.com","password":"123456","role":"authenticated"}'

echo "Test users created successfully!"
echo "Login credentials:"
echo "test1@example.com / 123456"
echo "test2@example.com / 123456"
echo "test3@example.com / 123456"