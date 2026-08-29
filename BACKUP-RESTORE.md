# Alpha Queen Website Backup

This backup contains the Alpha Queen cosmetics ecommerce website source code,
checkout, order API, admin order desk, database schema, and migration files.

## Restore from the source archive

1. Extract `alpha-queen-website-source.tar.gz`.
2. Run `npm install`.
3. Run `npm run build` to verify the project.
4. Run `npm run dev` to start the local website.

## Restore the Git repository

Run:

```sh
git clone alpha-queen-website.bundle alpha-queen-website
```

The `output/` and `tmp/` folders are intentionally excluded because they hold
unrelated temporary and document-signing files. No passwords, OTPs, or account
credentials are included in this backup.
