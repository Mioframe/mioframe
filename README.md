# Mioframe

A simple local app for your data. No cloud lock-in, no subscriptions, no extra friction.

[👉 Open Mioframe](https://vyachean.github.io/mioframe/)

## Why I Built It

I built Mioframe because I got tired of cloud software that charges you while quietly taking control of your data. I wanted a dependable tool for keeping track of personal information, whether it's a grocery list, a tool inventory, or a catalog of books I've read, and I wanted it to:

- keep my data safe from server-side errors
- work offline, without an internet connection
- work equally well on a phone and on a desktop
- easily move data between devices without subscriptions or arbitrary limits
- be approachable for non-technical users
- avoid sign-ups and everything that comes with them
- just work

Mioframe is for those who want to own their lists and data outright. It is not a service. There is no registration, no hosted backend, no cloud subscription, and no vendor lock-in.

## Main Features

- 🔒 **Your data stays with you:** Your records are not shipped off to someone else's servers. You decide where they live. Keep them in the browser's OPFS storage, or point Mioframe at a folder on your own device.
- ✈️ **Offline by default:** The app and your data are still there when the internet is not.
- 🔄 **Sync without a middleman:** Mioframe uses a CRDT-based data format, so you can move files between devices however you like, whether that is a USB drive, direct file transfer, or a cloud service you trust. The data merges cleanly without overwriting your work.
- 📱 **Uncompromised Mobile Experience:** Full feature parity. You get the exact same functionality whether you're on a phone or a desktop. We don't hide features behind smaller screens.

## What You Can Already Do

Today, Mioframe helps you:

- create tables for almost everything, including grocery lists, tool inventories, and book collections
- define fields such as text, numbers, and checkboxes
- filter and sort records
- choose local data storage

## What's Next?

Right now, I am working on more flexible data modeling.
After that, I'm going to add more ways to view, structure, and populate data.
Meanwhile, I continue to improve performance and tune the interface for larger datasets.

## Privacy

Privacy details for the release are available in [Privacy Policy](./PRIVACY.md).

User documentation is available in [docs/user/README.md](./docs/user/README.md).

## Feedback

Mioframe is still under active development, and your feedback genuinely helps shape where it goes next. If you want to share thoughts, report a problem, or suggest an idea, feel free to reach out on GitHub:

- Found a bug? Please open an [Issue](https://github.com/Vyachean/mioframe/issues).
- Have an idea or a question? Join the [Discussions](https://github.com/Vyachean/mioframe/discussions).

## Development

Developer setup, build, test, and linting instructions live in [DEVELOPMENT.md](./DEVELOPMENT.md).

## Implemented Features and Plans

- Workspace organization
  - [x] Choose a local folder for data storage
  - [x] Create folders
  - [x] Rename folders
  - [x] Delete folders
  - [x] Import a document from JSON
  - [ ] Move folders
- Record structure modeling
  - [x] Configure record properties
  - [x] Text properties
  - [x] Number properties
  - [x] Boolean properties
  - [x] Date
  - [x] Relations between records
  - [ ] Calculated properties
- Data entry
  - [x] Add records
  - [x] Edit records
  - [x] Delete records
- Data presentation
  - [x] Configure multiple views
  - [x] Sort records
  - [x] Multi-level sorting
  - [x] Filter records
  - [x] Table view
  - [ ] Hide columns
  - [ ] Rearrange columns
  - [ ] List view
  - [ ] Card gallery
  - [ ] Calendar
  - [ ] Kanban
  - [ ] Manual record sorting
- Data management
  - [x] Export documents to JSON

## License

Licensed under the [Functional Source License, Version 1.1 (3-Year Term), MIT Future License](./LICENSE).
