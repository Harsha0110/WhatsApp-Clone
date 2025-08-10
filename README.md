# WhatsApp Web Clone

A full-stack WhatsApp Web clone with real-time messaging capabilities, built with Node.js, React, TypeScript, and MongoDB.

## Features

- **Real-time Messaging**: Live message updates using Socket.IO
- **WhatsApp-like UI**: Responsive design that mimics WhatsApp Web
- **Message Status**: Sent, delivered, and read status indicators
- **Webhook Processing**: Handle WhatsApp Business API webhooks
- **Mobile Responsive**: Works seamlessly on mobile and desktop
- **Message Types**: Support for text, image, video, audio, and document messages

## Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.IO** for real-time communication
- **TypeScript** for type safety

### Frontend
- **React** with TypeScript
- **Socket.IO Client** for real-time updates
- **React Icons** for UI icons
- **Date-fns** for date formatting
- **Responsive CSS** for mobile-first design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-clone
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your MongoDB URI
   # For local MongoDB: MONGODB_URI=mongodb://localhost:27017/whatsapp
   # For MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whatsapp
   ```

4. **Start the development servers**
   ```bash
   # Start both server and client
   npm run dev
   
   # Or start them separately:
   # Server: npm run server
   # Client: cd client && npm start
   ```

## Usage

### Development

1. **Server**: Runs on `http://localhost:5000`
2. **Client**: Runs on `http://localhost:3000`

### Webhook Processing

The application can process WhatsApp Business API webhooks:

- **POST** `/api/webhooks/process` - Process incoming webhook payloads
- **POST** `/api/webhooks/process-samples` - Process sample payload files

### API Endpoints

- **GET** `/api/messages/conversations` - Get all conversations
- **GET** `/api/messages/conversation/:wa_id` - Get messages for a conversation
- **POST** `/api/messages/send` - Send a new message
- **PUT** `/api/messages/status/:messageId` - Update message status

## Sample Data

To test the application with sample data:

1. Download the sample payloads from the provided Google Drive link
2. Extract the JSON files to `server/samples/` directory
3. Call the webhook processing endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/webhooks/process-samples
   ```

## Deployment

### Vercel Deployment

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

### Environment Variables for Production

Set these environment variables in your hosting platform:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `PORT`: Server port (usually set automatically)
- `CLIENT_URL`: Your frontend URL

## Project Structure

```
whatsapp-clone/
├── server/
│   ├── index.js              # Main server file
│   ├── models/
│   │   └── Message.js        # MongoDB message model
│   ├── routes/
│   │   ├── messages.js       # Message API routes
│   │   └── webhooks.js       # Webhook processing routes
│   └── samples/              # Sample webhook payloads
├── client/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatList.css
│   │   │   ├── ChatWindow.tsx
│   │   │   └── ChatWindow.css
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

## Features in Detail

### Real-time Messaging
- Socket.IO integration for live message updates
- Automatic message status updates
- Real-time conversation list updates

### WhatsApp-like Interface
- Clean, modern UI design
- Message bubbles with proper styling
- Status indicators (sent, delivered, read)
- Date separators in conversations
- Responsive design for all devices

### Message Types Support
- Text messages
- Image messages (placeholder)
- Video messages (placeholder)
- Audio messages (placeholder)
- Document messages (placeholder)

### Webhook Processing
- Handles WhatsApp Business API webhooks
- Processes message and status updates
- Supports sample payload processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes only.

## Support

For issues and questions, please create an issue in the repository. 