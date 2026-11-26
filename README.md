# Vulnera Care

Build a modern, responsive web app for "Vulnera", a smart bandage that monitors wound healing in real time, detects early signs of infection, and alerts patients before complications like sepsis develop.

The app has two parts:

1. A landing/pitch website

2. An interactive demo of the Vulnera patient mobile app, using simulated data

## Brand & Design

- Name: Vulnera. Use a simple wordmark in the header with a small minimal icon (a droplet or bandage cross).

- Clean, trustworthy medical-tech look: white and soft off-white backgrounds, a calm teal/blue primary color, and green/amber/red used only for status (healthy/warning/critical)

- Rounded cards, generous spacing, subtle animations, Inter or similar sans-serif font

- Mobile-first, fully responsive, light mode

- Tone: professional, reassuring, not alarmist

## Part 1: Landing page sections

1. Hero: headline "Catch infection early. Heal with confidence." Subheadline: Vulnera is a smart bandage that monitors your wound in real time and alerts you before complications develop. CTAs: "See the Demo" and "Join the Waitlist".

2. The Problem: sepsis-related complications cause about 11 million deaths a year worldwide, roughly 20% of global deaths (WHO). Sepsis is life-threatening, and early recognition and treatment are critical. Show this as large animated stat cards.

3. The Gap: after hospital discharge, patients lose constant medical supervision, and infections can progress unnoticed when monitoring relies only on visual checks.

4. How Vulnera Works, in 3 steps: (1) Smart bandage sensors continuously track wound indicators, (2) the data is analyzed in real time to detect early infection-related changes, (3) the patient gets an instant alert in the Vulnera app and can contact medical staff quickly.

5. Who It Helps: post-operative patients, trauma and injury patients, people in rehabilitation or home recovery, and healthcare providers.

6. Financial Impact: sepsis is one of the most expensive hospital conditions. The average cost of a sepsis hospitalization in the US was about $21,700 in 2021 (AHRQ), and costs rise further with ICU care, longer stays, and rehabilitation. Early detection can help reduce this burden on patients and healthcare systems.

7. Benefits: continuous monitoring instead of visual-only checks, earlier medical contact, lower risk of unnoticed infection progression, greater patient awareness and peace of mind.

8. Waitlist: an email signup form (front-end only, show a success message), plus a footer with "© Vulnera" and a medical disclaimer: "Vulnera is a monitoring aid and does not replace professional medical advice."

## Part 2: Interactive patient app demo (route /demo)

Show a phone-frame mockup of the Vulnera app with these screens, using simulated data:

- Dashboard: a big wound status indicator (Healthy / Watch / Alert), plus live-updating cards for temperature, pH, moisture, and a "healing score". Include small trend charts for the last 24 hours (use Recharts).

- Alerts: a timeline of notifications, e.g. "Slight temperature rise detected" (amber) or "Multiple infection indicators detected, contact your doctor" (red), each with a recommended action and a "Contact my doctor" button.

- History: a 7-day trend view of all metrics.

- Care team: placeholder doctor contact card with call/message buttons.

- Add a "Simulate scenario" toggle on the demo page that switches between Normal healing, Early infection warning, and Critical alert, so viewers can watch the dashboard, colors, and notifications change live.

## Technical notes

- React + TypeScript + Tailwind + shadcn/ui, Recharts for charts

- All data is mocked locally. No backend required for now.

- Smooth scroll navigation with a sticky header (Home, How it works, Demo, Waitlist)

- Accessible, with good contrast and ARIA labels on status indicators

Start with the landing page and demo dashboard, then add the other screens.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/537d0f32-8fb0-5dc2-9800-f4b7f2276217).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
