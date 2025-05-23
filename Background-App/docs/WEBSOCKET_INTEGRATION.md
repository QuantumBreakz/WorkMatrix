# WebSocket Integration Documentation

## Overview

This document describes the WebSocket integration between the WorkMatrix frontend and backend applications. The integration enables real-time communication for activity tracking, screenshots, and status updates.

## Architecture

### Components

1. **Backend WebSocket Server** (`websocket_server.py`)
   - Handles WebSocket connections
   - Manages user sessions
   - Broadcasts updates to connected clients
   - Implements authentication

2. **Frontend WebSocket Service** (`websocket-service.ts`)
   - Manages WebSocket connections
   - Handles reconnection logic
   - Maintains connection state
   - Processes incoming messages

3. **Employee Dashboard** (`dashboard/page.tsx`)
   - Displays real-time activity metrics
   - Shows connection status
   - Handles error states
   - Updates UI based on WebSocket events

## Message Types

### From Frontend to Backend

1. **Authentication**
```json
{
  "type": "auth",
  "user_id": "user123",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

2. **Ping**
```json
{
  "type": "ping",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

### From Backend to Frontend

1. **Activity Update**
```json
{
  "type": "activity_update",
  "data": {
    "mouseMovements": 100,
    "keyboardEvents": 50,
    "scrollEvents": 25,
    "networkRequests": 10,
    "lastActive": "2024-03-14T12:00:00Z",
    "totalActiveTime": 3600000,
    "idleTime": 300000
  },
  "timestamp": "2024-03-14T12:00:00Z"
}
```

2. **Screenshot Update**
```json
{
  "type": "screenshot_update",
  "data": {
    "id": "screenshot123",
    "timestamp": "2024-03-14T12:00:00Z",
    "base64": "..."
  },
  "timestamp": "2024-03-14T12:00:00Z"
}
```

3. **Status Update**
```json
{
  "type": "status_update",
  "status": "synced",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

4. **Error Message**
```json
{
  "type": "error",
  "error": "Connection lost",
  "timestamp": "2024-03-14T12:00:00Z"
}
```

## Error Handling

### Backend Error Handling

1. **Connection Errors**
   - Logs connection errors
   - Attempts to clean up resources
   - Notifies connected clients

2. **Message Processing Errors**
   - Logs invalid messages
   - Sends error responses
   - Maintains connection stability

### Frontend Error Handling

1. **Connection Management**
   - Automatic reconnection attempts (max 5)
   - Exponential backoff
   - Connection state tracking

2. **Message Processing**
   - JSON parsing error handling
   - Type validation
   - Fallback values

3. **UI Error States**
   - Connection status indicators
   - Error messages
   - Retry count display

## Security

1. **Authentication**
   - User ID validation
   - Session management
   - Connection cleanup

2. **Message Validation**
   - Type checking
   - Data validation
   - Timestamp verification

## Performance Considerations

1. **Connection Management**
   - Ping/pong for connection health
   - Automatic reconnection
   - Resource cleanup

2. **Message Handling**
   - Message queuing
   - Batch processing
   - Rate limiting

3. **UI Updates**
   - Debounced updates
   - Efficient rendering
   - State management

## Setup and Configuration

### Backend Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```env
WEBSOCKET_HOST=localhost
WEBSOCKET_PORT=8765
```

3. Start the WebSocket server:
```bash
python src/main.py
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure WebSocket connection:
```typescript
const ws = new WebSocket('ws://localhost:8765');
```

3. Start the development server:
```bash
npm run dev
```

## Testing

1. **Connection Testing**
   - Verify connection establishment
   - Test reconnection logic
   - Check error handling

2. **Message Testing**
   - Validate message formats
   - Test data synchronization
   - Verify UI updates

3. **Error Testing**
   - Simulate connection drops
   - Test invalid messages
   - Verify error states

## Monitoring

1. **Backend Monitoring**
   - Connection count
   - Message throughput
   - Error rates

2. **Frontend Monitoring**
   - Connection status
   - Message processing
   - UI performance

## Troubleshooting

1. **Connection Issues**
   - Check network connectivity
   - Verify server status
   - Review error logs

2. **Message Issues**
   - Validate message format
   - Check data types
   - Review processing logic

3. **Performance Issues**
   - Monitor resource usage
   - Check message frequency
   - Review UI updates

## Best Practices

1. **Code Organization**
   - Separate concerns
   - Use TypeScript interfaces
   - Implement proper error handling

2. **Error Handling**
   - Graceful degradation
   - User feedback
   - Logging

3. **Performance**
   - Optimize message size
   - Implement caching
   - Use efficient updates

## Future Improvements

1. **Features**
   - Message compression
   - Binary data support
   - Advanced authentication

2. **Performance**
   - Connection pooling
   - Message batching
   - Caching strategies

3. **Monitoring**
   - Advanced metrics
   - Real-time alerts
   - Performance tracking 