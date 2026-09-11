# 0002: Use UUIDs instead of auto-incrementing integers for primary keys

## Context

Every row in users, links, and click_events needs a unique identifier. The
common default in Postgres is an auto-incrementing integer (serial/bigserial).

## Decision

I chose UUIDs (generated via gen_random_uuid()) instead of auto-incrementing
integers for all primary keys.

## Why

An auto-incrementing integer is sequential and predictable — if link IDs are
1, 2, 3..., anyone can guess the next one and enumerate every link in the
database just by requesting /links/1, /links/2, /links/3, and so on. A UUID
is not guessable in this way, so it closes off that specific enumeration
problem, and it also avoids quietly exposing internal information like
roughly how many users or links exist.

It's important to be precise about what this actually buys, though: a UUID
makes an ID hard to _guess_, but guessing is only one way an ID could be
obtained — it could also leak through a shared link, a log file, or a
referrer header. Using a UUID does not, by itself, mean a request is
authorized. This is the actual distinction between authentication (who you
are) and authorization (what you're allowed to touch), and it applies here
too: the API must still separately check that the requesting user actually
owns or has permission to access a given record, on every request, regardless
of whether the ID is a UUID or an integer. UUIDs reduce the risk of casual
enumeration (this is the category of vulnerability called IDOR — Insecure
Direct Object Reference), but they are not a substitute for a real
authorization check.

## Tradeoff

UUIDs aren't free. They're 128 bits versus an integer's 32/64 bits, so they
take up more storage and produce slightly larger indexes. They're also
harder to read and type during manual debugging (a3f29b12-... versus 47).
Random UUIDs (v4) also insert in random order rather than growing
sequentially, which can fragment index performance at very large scale,
since Postgres has to insert new rows into random positions in the index
structure instead of appending to the end. None of this is a real concern
at this project's scale, but it's the honest cost being traded for the
security benefit.
