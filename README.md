# Fugitives Statistics Centre

A club-wide career statistics website for Newport Fugitives Cricket Club, combining records from the 1st XI, 2nd XI and 3rd XI.

## Included

- 242 combined player records
- Searchable and sortable player table
- Batting, bowling and fielding leaderboards
- Individual career profiles
- Status and XI-span filters
- Milestone clubs and club records
- Responsive mobile layout
- Live updates from the published Google Sheet
- Bundled `public/stats.csv` fallback

## Put this project on GitHub

1. Create a new empty GitHub repository.
2. Extract this ZIP file.
3. Upload all extracted files and folders to the repository.
4. Commit the files.

## Run it locally

Install Node.js, then run:

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## Data source

The website reads the club's published Google Sheet through `app/api/stats/route.ts`. A complete snapshot is stored at `public/stats.csv`, so the player records remain available if Google temporarily blocks the live request.

To update the bundled snapshot, download the published sheet as CSV and replace `public/stats.csv`. Keep the same column headings.

## Main files

- `app/page.tsx` — website and interactions
- `app/globals.css` — design and mobile layout
- `app/api/stats/route.ts` — live Google Sheet connection
- `public/stats.csv` — bundled player records
- `app/layout.tsx` — page title and metadata

## Important hosting note

This is a Next.js/Vinext project, so uploading the source to GitHub stores the project but does not by itself publish it through basic GitHub Pages. Connect the repository to a compatible web host, or continue using the already published version of the Statistics Centre.
