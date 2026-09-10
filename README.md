# Shortly

A URL shortener with click analytics. Users create short links, share them,
and see how they perform: clicks over time, top referrers, device breakdown.

## Stack

- Dashboard: Next.js
- API & redirect: Node
- Database: Postgres
- Cache: Redis
- Containerized with Docker Compose

## Running it

```bash
git clone <repo-url>
cd shortly
cp .env.example .env
docker compose up
```
