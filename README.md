# 🏢 Venue Booking Web Application - Hall Owner Module

The Hall Owner Module is a dashboard-based interface built using **React (Vite)** and **Tailwind CSS**, designed to help venue owners manage their halls, bookings, and revenue efficiently.

## 🧩 Layout & Navigation
Uses a sidebar layout for navigation.
- **Menu includes:**
  - Halls
  - Revenue Tracking
  - Booking History
  - Notifications
- **Topbar includes:**
  - Owner profile info
  - Logout option

## 🏗️ Halls Section
Displays all added venues in card/grid view.
If no halls exist → shows “Add Venue” call-to-action.
- **Features:**
  - Add new hall (form-based input)
  - Edit hall details
  - View detailed hall information
  - Update availability (calendar-based)
  - Display images, features, and capacity
  - Show ratings & reviews

## 💰 Revenue Tracking Section
Displays revenue data using:
- Summary cards (total, monthly revenue)
- Charts (monthly and hall-wise)
- Shows recent transactions
- Handles empty state (no transactions message)

## 📜 Booking History Section
Displays bookings in table format.
- **Features:**
  - View booking details
  - Export booking data as CSV

## 🔔 Notifications Section
Organized into sub-sections:
- Booking Requests
- Cancellations
- Payments

**Features:**
- Accept / decline booking requests
- View cancellations
- Track payment status (success/pending)
- Mark all notifications as read

## 🎨 UI/UX Features
- Responsive design (mobile + desktop)
- Dynamic rendering based on data
- Reusable components (cards, tables, modals)
- Interactive elements (buttons, charts, filters)

## 🔗 Integration
- Connects to backend APIs using Axios
- Dynamically updates UI based on database data
- Designed for real-time updates and scalability

## 🏁 Summary

The Hall Owner Module provides a centralized dashboard for venue owners to:
- Manage halls
- Monitor bookings
- Track revenue
- Handle notifications

with a clean, interactive, and scalable frontend architecture.
