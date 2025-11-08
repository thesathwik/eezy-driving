# EAZYDRIVING Backend API

Production-ready RESTful API for the EAZYDRIVING platform built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based access control (Learner, Instructor, Admin)
- Instructor profile management (7-step onboarding)
- Learner profile management
- Booking system for driving lessons
- Review and rating system
- Secure password hashing with bcrypt
- MongoDB database with Mongoose ODM
- Input validation and error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS
- **Logging**: Morgan

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) - Local installation OR MongoDB Atlas account
- npm or yarn

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eazydriving
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

## Database Setup

### Option 1: Local MongoDB

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (Free tier available)
3. Get connection string and update `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eazydriving?retryWrites=true&w=majority
```

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/updatepassword` | Update password | Private |

### Instructors

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/instructors` | Get all instructors | Public |
| GET | `/api/instructors/:id` | Get instructor by ID | Public |
| POST | `/api/instructors/profile` | Create/update profile | Instructor |
| GET | `/api/instructors/profile/me` | Get own profile | Instructor |
| PUT | `/api/instructors/availability` | Update availability | Instructor |
| PUT | `/api/instructors/pricing` | Update pricing | Instructor |
| PUT | `/api/instructors/visibility` | Toggle marketplace visibility | Instructor |
| GET | `/api/instructors/stats/me` | Get own stats | Instructor |

### Learners

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/learners/profile` | Get learner profile | Learner |

### Bookings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/bookings` | Get bookings | Private |

### Reviews

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reviews` | Get reviews | Public |

## API Request Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0412345678",
  "role": "instructor"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Instructor Profile
```bash
POST /api/instructors/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "gender": "male",
  "postcode": "4000",
  "bio": "Experienced driving instructor...",
  "languages": ["English", "Spanish"],
  "vehicle": {
    "transmissionOffered": "auto",
    "transmission": "auto",
    "registration": "ABC123",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "ancapRating": "5 Stars",
    "hasDualControls": true
  },
  "pricing": {
    "marketplaceLessonRate": 82,
    "privateLessonRate": 80,
    "marketplaceTestPackageRate": 225,
    "privateTestPackageRate": 225
  }
  ...
}
```

## Database Models

### User
- Base authentication model
- Fields: firstName, lastName, email, password, phone, role
- Methods: comparePassword, generateAuthToken

### Instructor
- Complete instructor profile (7 steps)
- Fields: personal details, vehicle, service area, hours, pricing, banking
- Virtual: yearsOfExperience, bookings, reviews

### Learner
- Learner profile
- Fields: personal details, license info, preferences, progress

### Booking
- Lesson/test package bookings
- Fields: learner, instructor, lesson details, pricing, status

### Review
- Instructor reviews and ratings
- Fields: booking, rating, comment, instructor response

## Security Features

- Password hashing with bcrypt (cost: 12)
- JWT token authentication
- Protected routes with middleware
- Role-based access control
- Helmet for HTTP headers security
- CORS configuration
- Input validation

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Success responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── instructorController.js
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Instructor.js
│   │   ├── Learner.js
│   │   ├── Booking.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── instructors.js
│   │   ├── learners.js
│   │   ├── bookings.js
│   │   └── reviews.js
│   └── server.js              # Main server file
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Testing the API

You can test the API using:

1. **Postman**: Import the endpoints and test
2. **cURL**: Command-line testing
3. **Thunder Client**: VS Code extension
4. **Browser**: For GET requests

Example cURL:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "0412345678"
  }'
```

## Deployment

### Environment Variables for Production

Ensure these are set in your production environment:
- `NODE_ENV=production`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Strong secret key
- `CLIENT_URL`: Your frontend URL

### Deployment Platforms

- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern platform with auto-deploy
- **DigitalOcean**: VPS with more control
- **AWS/GCP**: Enterprise-grade deployment

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions:
- Check the documentation
- Review error logs
- Contact the development team

## License

Proprietary - EAZYDRIVING Platform
