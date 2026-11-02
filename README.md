# EduPre Plus

**Predict early. Intervene timely. Improve performance.**

EduPre Plus is a NEW, SEPARATE project built on the MERN stack (React, Node.js/Express, MongoDB).
It adds three things to the original EduPre: **daily attendance**, a **Mentor** role, and an
**intervention approval workflow**.

## It does not touch the original EduPre

|                 | Original EduPre        | **EduPre Plus (this project)**      |
|-----------------|------------------------|-------------------------------------|
| Backend port    | 5000                   | **5001**                            |
| Website port    | 5173                   | **5174**                            |
| MongoDB database| `edupre`               | **`edupre_plus`**                   |
| Login storage   | `edupre_*`             | `edupre_plus_*`                     |

You can run both at the same time. Both can use the same MongoDB server
(`mongodb://127.0.0.1:27017`): MongoDB keeps the two databases apart, and in MongoDB Compass you
will see `edupre` and `edupre_plus` side by side. To use another MongoDB server, change
`MONGO_URI` in `backend/.env`. The seed script refuses to run on a database named `edupre`.

## Run it (Windows, VS Code)

You need Node.js 18+ and MongoDB running. Open two terminals.

**Terminal 1 - backend**
```
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```
You should see `MongoDB connected` and `EduPre Plus API running on port 5001`.

**Terminal 2 - website**
```
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open **http://localhost:5174**

### Demo logins (after `npm run seed`)
| Role    | E-mail                    | Password   |
|---------|---------------------------|------------|
| Faculty | faculty@edupreplus.edu    | faculty123 |
| Mentor  | mentor@edupreplus.edu     | mentor123  |
| Mentor 2| mentor2@edupreplus.edu    | mentor123  |
| Admin   | admin@edupreplus.edu      | admin123   |
| Student | student@edupreplus.edu    | student123 |

The seed creates 12 students, 40 weekdays of attendance history, and interventions in every
state (awaiting approval, approved, in progress, resolved, rejected).

## What each role can do

| | Student | Mentor | Faculty | Admin |
|---|:--:|:--:|:--:|:--:|
| See own progress, attendance and alerts | yes | | | |
| See students | | own mentees only | all | all |
| Take daily attendance | | own mentees | all | all |
| Add / edit / delete students, bulk upload | | | yes | yes |
| Assign a mentor to a student | | | yes | yes |
| **Propose** an intervention | | yes | | |
| **Approve / reject** a proposal | | | yes | yes |
| Carry out an approved intervention (start, resolve) | | own mentees | yes | yes |
| Create users, change roles, reports, CSV | | | | yes |

## New features

**1. Daily attendance.** *Attendance* page: choose a date, class (year/section), mark each student
Present / Absent / On Duty (On Duty counts as present), press Save. For every student the system
then recalculates, automatically: attendance % (days present / days recorded), risk score and level,
the trend graph, and alerts. Once daily attendance exists for a student, the attendance value is
calculated and can no longer be typed by hand. Marking the same date again updates it.

**2. Mentor role.** Each student can be assigned to a mentor. A mentor has their own dashboard, sees
only their mentees, takes attendance for them, and has a profile page. Mentors cannot edit student
records.

**3. Intervention approval.**
```
Mentor proposes  ->  Proposed  --faculty/admin-->  Approved  ->  In Progress  ->  Resolved
                                         \--> Rejected (a reason is required)
```
A proposal does nothing until faculty approve it. Interventions created by faculty/admin are
approved at once.

**4. Notifications (bell icon, every role).** Faculty/admin/mentor are alerted when a student
becomes High risk; mentor and student when attendance falls below 75%; faculty when a mentor
proposes something; the mentor when a proposal is approved/rejected; faculty when a mentor resolves
one. Optional e-mail for High risk and approval requests: fill the `SMTP_*` lines in `backend/.env`.

**Also included from EduPre:** risk scoring (weights 30/30/20/10/10), bulk CSV upload (new column
`mentorEmail`), admin Users and Reports (by year, section, mentor) with CSV download, student portal,
JWT login, input validation, login rate limiting, responsive layout.

## Tests

```
cd backend
npm test                      # 19 unit + API tests, no database needed
```
Full database test (it ERASES the database it uses - always use a throw-away name):
```
set MONGO_URI=mongodb://127.0.0.1:27017/edupre_plus_test
npm run test:integration
```
(On PowerShell: `$env:MONGO_URI="mongodb://127.0.0.1:27017/edupre_plus_test"`.)

## Troubleshooting

- **Nothing in Compass?** The database appears only after data is written. Run `npm run seed`,
  then refresh Compass and open `edupre_plus`.
- **`MongoDB connection error`:** MongoDB is not running, or `MONGO_URI` in `backend/.env` is wrong.
  Restart `npm run dev` after editing `.env`.
- **Login fails / blank page:** the backend must be running on 5001 and `frontend/.env` must say
  `VITE_API_URL=http://localhost:5001/api`.
- **Port already in use:** change `PORT` in `backend/.env` (and `VITE_API_URL`), or the port in
  `frontend/vite.config.js` (and `CLIENT_URL` in `backend/.env`).
