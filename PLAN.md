# The Stephens Family Hub - Development Plan

## Phase 1: Core Platform (DONE)
- [x] Project setup (Next.js + TypeScript + Tailwind)
- [x] Sidebar navigation with family member switcher
- [x] Dashboard with personalised greeting and quick links
- [x] AI Chat with Claude (Anthropic API)
- [x] Custom AI Agent creation (name, description, system prompt)
- [x] Family Calendar (monthly view, events, categories, recurring)
- [x] Tasks & Chores (assign, categories, recurring, completion)
- [x] Shopping List (categories, quick-add, check off)
- [x] Meal Planner (weekly grid, breakfast/lunch/dinner)
- [x] Bulletin Board (announcements, reminders, pin posts)
- [x] Zustand state with localStorage persistence
- [x] Pre-built agents (Family Assistant, Meal Planner, Homework Helper)

## Phase 2: Personalisation & Polish
- [ ] Personalise family member names (Mum's name, children's names)
- [ ] Profile pictures / avatar upload
- [ ] Dark mode toggle
- [ ] Mobile responsive improvements
- [ ] Calendar week view option
- [ ] Drag and drop for tasks
- [ ] Notification badges on sidebar

## Phase 3: Smart Features
- [ ] AI-powered meal suggestions based on preferences
- [ ] Smart reminders (upcoming deadlines, birthdays)
- [ ] Weather widget on dashboard
- [ ] School term dates integration
- [ ] Budget tracker / pocket money tracker
- [ ] Family photo gallery

## Phase 4: Multi-device & Auth
- [ ] User authentication (login per family member)
- [ ] Database backend (PostgreSQL / Supabase)
- [ ] Real-time sync across devices
- [ ] Push notifications
- [ ] PWA (installable on phones)
- [ ] Family invite system

## Phase 5: Advanced
- [ ] Google Calendar sync
- [ ] Alexa / Google Home integration
- [ ] Family chat (member-to-member messaging)
- [ ] Shared documents / files
- [ ] Homework tracker with school integration
- [ ] Chore reward system / points

## Tech Notes
- State: Zustand with persist (localStorage for now, DB later)
- AI: Anthropic Claude API via Next.js API route
- Styling: Tailwind CSS with custom theme variables
- No auth yet - designed for single household on one device/network
