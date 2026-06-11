# GigFin user guide

A complete walkthrough of everything GigFin does, written for everyday use — no
technical background needed. For installing/hosting GigFin, see the
[README](../README.md).

## Contents

1. [What GigFin is](#1-what-gigfin-is)
2. [Getting started](#2-getting-started)
3. [The dashboard](#3-the-dashboard)
4. [Logging your work](#4-logging-your-work)
5. [Recurring expenses](#5-recurring-expenses)
6. [Vehicles & charging vendors](#6-vehicles--charging-vendors)
7. [Goals & budgets](#7-goals--budgets)
8. [Taxes & year-end reports](#8-taxes--year-end-reports)
9. [Importing & exporting data](#9-importing--exporting-data)
10. [Moving from GigFin v1](#10-moving-from-gigfin-v1)
11. [Settings](#11-settings)
12. [Your account & security](#12-your-account--security)
13. [How your data is stored](#13-how-your-data-is-stored)
14. [Tips & things to know](#14-tips--things-to-know)

---

## 1. What GigFin is

GigFin is a private income-and-expense ledger for gig workers — delivery,
rideshare, and freelance. You record what you earn and spend, and GigFin turns it
into live dashboards, an effective hourly rate, a tax estimate, and year-end
reports.

Three things to know up front:

- **It's yours.** GigFin runs on infrastructure you (or whoever hosts it) control.
  Your data never leaves it.
- **It's live.** Changes appear instantly across every open tab and device — no
  refreshing. Log an expense on your phone and the dashboard on your laptop
  updates by itself.
- **Money is shown in your currency.** You set it once in Settings.

---

## 2. Getting started

### Create an account

1. Open the GigFin URL your host gave you.
2. On the welcome screen, choose **Sign up** (if enabled).
3. Enter your name, email, and a password (at least 8 characters).
4. You're taken straight to your dashboard. A blank ledger is ready to fill.

> If sign-up is turned off, you'll only see **Sign in** — ask your host to create
> your account.

### Sign in

1. Enter your email and password → **Sign in**.
2. If you've turned on two-factor authentication, you'll then be asked for a
   6-digit code from your authenticator app (or a backup code). See
   [Your account & security](#12-your-account--security).

### Install it like an app (optional)

GigFin is a Progressive Web App, so you can add it to your home screen:

- **Android / desktop Chrome or Edge:** open the browser menu → *Install* /
  *Add to Home screen*.
- **iPhone/iPad (Safari):** Share button → *Add to Home Screen*.

It then opens full-screen, like a native app.

### Light or dark theme

Use the sun/moon button at the bottom of the sidebar to switch. Your choice is
remembered on that device.

---

## 3. The dashboard

The dashboard is your at-a-glance view. It's made of **widgets** you can
rearrange, and a **timeframe** that scopes most of them.

### The timeframe filter

At the top right of the dashboard, pick the period most widgets should cover:

- **Today**, **Yesterday**, **This week**, **This month**, **Year to date**,
  **Last 12 months**, **All time**.

Your choice is saved to your account, so it sticks between visits. Some widgets
(today's snapshot, the tax estimate, goals, budgets, run-rate, the cadence
heatmap) always use their own fixed period and ignore this filter — that's noted
per widget below.

### Customising the layout

1. Click **Customize**.
2. **Drag** any widget to reorder it.
3. Click a widget's **eye** icon to hide it; hidden widgets collect in a tray at
   the top — click one to bring it back.
4. **Reset** restores the original layout; **Done** saves.

Your layout and timeframe are saved per-account and follow you across devices.

### The widgets

GigFin ships 21 widgets. Two are pinned at the top; the rest you can show, hide,
and reorder.

**Always at the top**

- **Today** — today's net (income minus expenses) so far, with yesterday's net
  for comparison. *Fixed to today.*
- **Summary** — four numbers for the selected timeframe: Income, Expenses, Net,
  and Per hour (income ÷ hours worked).

**Shown by default**

- **Income vs expenses** — a 12-month bar chart of income (blue) vs expenses
  (orange) for the current year. *Fixed to this year.*
- **Tax estimate** — estimated income tax + National Insurance (UK) or
  self-employment tax (US) on your year's profit, your effective rate, and
  take-home. *Fixed to the tax year.* See [Taxes](#8-taxes--year-end-reports).
- **Income trend** — a line chart of income per day over the timeframe.
- **Profitability** — gross income, expenses, net profit, and profit margin (%).
- **Income by platform** — which platforms earned you the most, with bars.
- **Expenses by category** — where your money went, with bars.
- **Goals** — progress toward your income/savings targets. See [Goals](#7-goals--budgets).
- **Budgets** — spending against your limits (turns red when over). See [Budgets](#7-goals--budgets).

**Available in Customize (hidden by default)**

- **Income per mile** — earnings per business mile driven.
- **Running cost** — fuel/charging spend per mile.
- **Driving** — total distance, trips logged, and how many vehicles you used.
- **Hours & shifts** — total hours, number of shifts, average shift length.
- **Expense overview** — total spend, count, and your biggest category.
- **Platform concentration** — what share of income came from your top platform
  (a diversification warning if it's ≥ 70%).
- **Yearly run-rate** — projected annual net profit at your current pace. *Fixed.*
- **Mileage deduction** — the tax value of your mileage allowance for the year.
  *Fixed to the tax year.*
- **Recent days** — net for each of the last 7 days. *Fixed.*
- **Recent entries** — your latest income and expense lines.
- **Daily cadence** — a 12-week heatmap of daily income (darker = more). *Fixed.*

---

## 4. Logging your work

Open **Logs** from the sidebar. It has four tabs — **Income**, **Expenses**,
**Mileage**, **Shifts** — each with search, a date-range filter, inline edit, and
delete. On a phone, rows become cards you can **swipe left** to delete.

> **Deletes now ask first.** Deleting any entry (or swiping a card away) shows a
> confirmation, so an accidental tap won't wipe a record.

### Income

1. On the **Income** tab, click **Add income**.
2. Fill in:
   - **Platform** — e.g. Uber, Deliveroo. As you type, GigFin suggests platforms
     you've used before — pick one so the same platform doesn't split into
     "Uber" and "uber".
   - **Amount**
   - **Date** (defaults to today)
3. **Add income.** It appears instantly and feeds the dashboard.

### Expenses

1. On the **Expenses** tab, click **Add expense**.
2. Fill in:
   - **Category** — fuel/charging, maintenance, insurance, tolls, phone, and more.
   - **Amount**
   - **Date**
   - **Vehicle** (optional) — defaults to your default vehicle on new entries.
   - **Notes** (optional)
3. **Add expense.**

**Fuel/charging with a saved vendor.** If the category is *Fuel charging* and
you've saved charging vendors (see [below](#6-vehicles--charging-vendors)), two
extra fields appear: pick a **vendor** and enter the **quantity** (e.g. kWh or
litres). GigFin works out the amount from the vendor's saved rate — you can still
adjust it. Leave the vendor on *Custom amount* to just type the price.

**Receipts.** Each expense row has a paperclip — click it to attach a photo of
the receipt (stored privately on your own backend). Receipts show as numbered
links (#1, #2); open one in a new tab, or shift-click to remove it (with a
confirmation).

### Shifts

Track the hours you work, two ways.

**Live (recommended while working):**

1. On the **Shifts** tab, click **Start shift**. A highlighted card shows it's
   running, with the elapsed time.
2. When you finish, click **End shift**. GigFin records the duration (it handles
   shifts that cross midnight).

**By hand (after the fact):**

1. Click **Add manually**.
2. Set the **date**, **start** and **end** times, and optionally a **platform**
   and **vehicle**.
3. **Add shift.**

Only one live shift can be open at a time. Hours worked feed your effective
hourly rate on the dashboard.

### Mileage

Track business distance, two ways.

**Live (a trip in progress):**

1. On the **Mileage** tab, click **Log start**, enter your odometer **start
   reading** (and optional vehicle), and **Start reading**. A card shows the open
   reading.
2. At the end of the trip, type the **end reading** on that card and **Log end**.
   GigFin records the distance.

**By hand:**

1. Click **Add manually**, enter the **start** and **end** readings, **date**,
   and optional **vehicle**.
2. **Add mileage.**

Distance is shown in km or miles per your Settings. Mileage powers the income-per-mile,
running-cost, and mileage-allowance figures.

---

## 5. Recurring expenses

For costs that repeat — insurance, finance, subscriptions — set them up once and
GigFin logs them for you.

You'll find them on the **Logs → Expenses** tab: click **Recurring** to open the
manager.

1. In the panel, fill in the **Add recurring expense** form:
   - **Category**, **Amount**
   - **Cadence** — Weekly, Every 2 weeks, Monthly, Quarterly, or Yearly
   - **Next due** — the date the first entry should be dated
2. Click **Add**. It appears in the list above.

**How the automatic logging works.** GigFin's backend creates the real expense
entries on schedule — each one dated to its due date — then moves the schedule on
to the next date. It catches up if any were missed (e.g. the app was offline),
and it runs both on a daily timer **and** the moment you open the app, so due
entries show up promptly. There's no external scheduler to maintain — it's part
of your self-hosted backend.

**Managing them.** In the same panel you can untick **Active** to pause a
template (it stops creating entries but keeps its place), or delete it. Deleting a
template leaves the expenses it already created untouched — those are normal
entries you can edit or remove like any other.

---

## 6. Vehicles & charging vendors

Both live in **Settings**.

### Vehicles

Add the vehicles you use so you can attribute expenses, mileage, and shifts to
them.

1. **Settings → Vehicles → Add vehicle.**
2. Give it a **label** (e.g. "Tesla Model 3"), a **type** (EV / petrol / diesel /
   hybrid), and optionally mark it **default**.

The default vehicle is pre-selected when you start a new expense, mileage, or
shift entry (you can always change it). The star icon makes a different vehicle
the default; the trash icon deletes one (its entries are simply unlinked, not
deleted).

### Charging vendors

Save the places you charge or fuel and their unit rate, so logging a fuel/charging
expense is just "vendor + quantity".

1. **Settings → Charging vendors → Add charging vendor.**
2. Enter a **label** (e.g. "Home", "Ionity"), the **rate**, and the **unit**
   (kWh, litre, US/imperial gallon).

These rates are then offered in the expense form for *Fuel charging* entries (see
[Expenses](#expenses)).

---

## 7. Goals & budgets

Both appear as cards on the **dashboard**.

### Goals

Set income or savings targets per period.

1. On the **Goals** card, click **Add goal**.
2. Choose **type** (Income, or Savings = net), **period** (Weekly or Monthly), and
   a **target amount**.
3. A progress bar tracks you toward it for the current period.

### Budgets

Set spending limits per period.

1. On the **Budgets** card, click **Add budget**.
2. Choose **scope** (Overall, or a single category), **period** (Weekly or
   Monthly), and a **limit**.
3. The bar fills as you spend and turns **red** if you go over.

Delete either with its trash icon (you'll be asked to confirm).

---

## 8. Taxes & year-end reports

GigFin estimates your self-employment tax and produces a printable year-end
summary. It's a transparent estimate computed on your own device — **not tax
advice**.

- **Set your jurisdiction** in **Settings → Preferences → Tax jurisdiction**
  (United Kingdom or United States).
- The **Tax estimate** dashboard widget shows the running figure for the current
  tax year: income tax + National Insurance (UK) or self-employment tax (US),
  your effective rate, and estimated take-home.
- The **Reports** page (sidebar) gives the full year-end breakdown — totals,
  tax, take-home, and breakdowns by platform and category — with a
  **Print / Save as PDF** button for your records or accountant.

It uses your income, expenses, and — where it helps — your mileage allowance. The
mileage allowance is shown for information; whether to claim it is up to you and
your accountant.

---

## 9. Importing & exporting data

In **Settings → Data**.

### Export

- **Export income** → a CSV with columns `date, platform, amount`.
- **Export expenses** → a CSV with columns `date, type, amount, notes`.

Files download as `gigfin-income.csv` / `gigfin-expenses.csv` — good for backups
or your accountant.

### Import

- **Import income** — a CSV with `date, platform, amount`.
- **Import expenses** — a CSV with `date, type, amount, notes` (the `type` must be
  one of GigFin's expense categories).

Dates must be `YYYY-MM-DD`. Imports **add** to your data — they don't replace it or
check for duplicates, so importing the same file twice creates duplicates.

---

## 10. Moving from GigFin v1

If you used the original (v1) GigFin, you can bring your ledger across.

1. **Settings → Data → Migrate from GigFin v1.**
2. Select your old `db.sqlite` file. It's read **entirely in your browser** —
   nothing is uploaded.
3. GigFin imports your vehicles, income, expenses, mileage, and charging vendors,
   and tells you the counts.

**What does not carry over:** your old account/password, two-factor setup,
sessions, preferences (currency/units/tax), and goals/budgets — set those up
fresh in v2. (You must be signed in to v2 before migrating.)

---

## 11. Settings

- **Preferences** — currency; unit system; fuel volume unit; odometer unit
  (km/mi); tax jurisdiction (UK/US). Click **Save changes** to apply.
- **Security** — change your password; turn two-factor on/off. See below.
- **Active sessions** — every device signed in, with a **Revoke** button each and
  **Sign out others** (both ask to confirm).
- **Vehicles**, **Charging vendors** — see [section 6](#6-vehicles--charging-vendors).
- **Data** — import/export and v1 migration — see sections [9](#9-importing--exporting-data)
  and [10](#10-moving-from-gigfin-v1).

---

## 12. Your account & security

### Two-factor authentication (2FA)

Adds a second step at sign-in using an authenticator app (Google Authenticator,
Authy, etc.).

**Turn it on:** **Settings → Security → Two-factor → Enable**. Enter your
password, scan the QR code with your authenticator, **save the backup codes
somewhere safe**, then enter a 6-digit code to confirm. The page reloads and 2FA
is on.

**Signing in with 2FA:** after your email + password, you'll be asked for the
6-digit code. Lost your phone? Choose **Use a backup code instead** and enter one
of the codes you saved — each works once.

**Turn it off:** **Settings → Security → Two-factor → Disable** (enter your
password).

### Sessions

**Settings → Active sessions** lists your signed-in devices. Revoke any one, or
sign out all others, to lock out a lost or shared device.

### Passwords & recovery

You can change your password any time in **Settings → Security**.

> **Forgot your password?** Self-service password reset requires email to be
> configured on your GigFin instance. If your host hasn't set up email, there is
> currently **no self-service reset** — you'll need your host to help recover the
> account. (An offline recovery-code option is planned but not yet available.)

---

## 13. How your data is stored

GigFin keeps everything in a database on your own backend (self-hosted Convex).
Two things this gives you:

- **Live updates.** The app subscribes to your data, so any change shows up
  immediately everywhere you're signed in — no refresh, no "sync" button.
- **Privacy & isolation.** Every record is tied to your account; you only ever see
  your own data, and none of it leaves your infrastructure. GigFin needs no
  internet connection to run.

Receipts (photos) are stored on the same backend — there's no third-party cloud.

---

## 14. Tips & things to know

- **Keep platform names consistent.** Use the suggestions when logging income or
  shifts so "Uber" and "uber" don't show up as two platforms in your breakdowns.
- **Deletes ask first, but are permanent.** Once confirmed, a deleted entry is
  gone — re-add it if you made a mistake.
- **One live shift / one open mileage reading at a time.** Close the current one
  before starting another.
- **Recurring expenses are dated by their due date**, not the moment they're
  created — so your records stay accurate even if the app was closed when one came
  due.
- **The tax figures are estimates**, meant to help you plan and to hand to an
  accountant — not a substitute for professional advice.
