# Good For Good - Trust Management System

A comprehensive web application built with Next.js for managing trust activities, members, donations, and events.

## Features

- **Member Management**
  - Track member profiles and contact information
  - Monitor member contributions
  - Manage trustee roles and responsibilities

- **Financial Management**
  - Track donations with purpose and donor details
  - Manage expenses with categories and payment methods
  - Generate financial reports and summaries

- **Activity Management**
  - Schedule and track trust activities
  - Manage participant registrations
  - Monitor budgets and actual expenses

- **Meeting Management**
  - Schedule meetings with agenda
  - Track attendance
  - Record and store meeting minutes

- **Workshop Resources**
  - Maintain a database of workshop resources
  - Track resource expertise and availability
  - Manage contact information and references

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Firebase/Firestore
- **Authentication**: Firebase Auth
- **UI Components**: HeadlessUI, Heroicons
- **Forms**: React Hook Form
- **Data Visualization**: Recharts
- **Date Handling**: date-fns
- **Type Safety**: TypeScript
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/goodforgood.git
   cd goodforgood
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
goodforgood/
├── app/                    # Next.js 14 app directory
│   ├── activities/        # Activities management
│   ├── donations/         # Donations tracking
│   ├── expenses/          # Expense management
│   ├── meetings/          # Meeting management
│   ├── members/          # Member management
│   ├── trustees/         # Trustee management
│   └── workshops/        # Workshop resources
├── components/            # Reusable React components
├── lib/                   # Utility functions and Firebase setup
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Key Features

### Member Management
- Complete member profiles
- Role-based access control
- Member contribution tracking
- Trustee role management

### Financial Management
- Donation tracking with categories
- Expense management
- Financial reporting
- Payment method tracking

### Activity Management
- Event scheduling
- Participant registration
- Budget tracking
- Status updates

### Meeting Management
- Meeting scheduling
- Attendance tracking
- Minutes recording
- Agenda management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js and Firebase
- UI components from HeadlessUI and Heroicons
- Styling with TailwindCSS 