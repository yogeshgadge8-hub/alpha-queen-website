# Alpha Queen Website Backup

This backup contains the Alpha Queen cosmetics ecommerce website source code,
checkout, order API, admin order desk, database schema, and migration files.

## Restore from the source archive

1. Extract `alpha-queen-website-source.tar.gz`.
2. Copy `.env.example` to `.env.local` and add the Hostinger MySQL values.
3. Run `npm install`.
4. Run `npm run build` to verify the project.
5. Run `npm run dev` to start the local website.

## Restore the Git repository

Run:

```sh
git clone alpha-queen-website.bundle alpha-queen-website
```

The `output/` and `tmp/` folders are intentionally excluded because they hold
unrelated temporary and document-signing files. No passwords, OTPs, database
credentials, or admin credentials are included in this backup. The first admin
username and password are created once at `/admin/setup` after deployment.
