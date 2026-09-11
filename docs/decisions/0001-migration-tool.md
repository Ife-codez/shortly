# 0001: Use node-pg-migrate instead of an ORM

## Context

The project needs a way to define and evolve the database schema through
version-controlled migration files, per the brief's rule that schema changes
must never be made by hand against a live database.

## Decision

I chose node-pg-migrate over an ORM-based option like Prisma. node-pg-migrate
requires writing migrations as plain, explicit table/column definitions that
map directly to the SQL Postgres will run, with no generated client or schema
abstraction layer sitting between the code and the database.

## Why

The point of this project is to understand what's actually happening at each
layer — how a slug collision is handled, why a redirect returns a particular
status code, what an index actually does for a query. An ORM like Prisma would
hide a lot of that behind a generated client and its own schema language,
which is powerful for production speed but works against the goal of
understanding fundamentals right now. node-pg-migrate keeps every migration
readable as close-to-raw SQL, and keeps the `pg` client itself as the only
thing my API code talks to — no second layer to reason about. I may reach for
an ORM on a future project once these fundamentals are solid.
