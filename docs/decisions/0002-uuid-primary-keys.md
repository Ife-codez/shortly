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
database just by requesting /links/1, /links/2, /links/3, and so on. This is
a well-known vulnerability category called IDOR (Insecure Direct Object
Reference), and it also quietly exposes internal information, like roughly
how many users or links exist. A UUID is not guessable in this way, so it
closes off that entire class of problem by default, without needing extra
application-level protection.

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