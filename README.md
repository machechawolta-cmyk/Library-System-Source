# LibraryFlow

A responsive library management app built with React, React Router, and browser local storage.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; run Oxlint with `npm run lint`.

## Features

- Inventory dashboard with a low-stock indicator for titles with fewer than two copies.
- Book catalogue with add, edit, and delete actions.
- Stock arrivals and borrowing records with validated quantities and transaction history.
- User accounts with membership IDs and Member, Staff, and Librarian roles.
- Local storage persistence for books, users, transactions, and the active demo session.
- Role-aware interface: Staff and Librarians manage inventory; Librarians manage users.

## Demo access

Sign in on the Users page using the seeded librarian account:

- Name: `Mpho T`
- Membership ID: `LIB-101`

The seeded staff account is `Alice N` with membership ID `LIB-102`.

Authentication is a front-end demonstration only. Data and session state are stored in the current browser, so this app is not suitable for production use or sensitive information.
