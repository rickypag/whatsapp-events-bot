# WhatsApp Events Bot

## Table of Contents
- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
- [AWS Lambda Implementation](#aws-lambda-implementation)
- [Other AWS Services](#other-aws-services)
- [Setup and Deployment](#setup-and-deployment)
- [Demo](#demo)
- [Future Enhancements](#future-enhancements)

## Introduction

The idea behind this project is to create a WhatsApp bot that allows users to create events and share them with their friends. In my experience, it is pretty common for people to share the events they want to go to with their friends. Therefore, a WhatsApp bot is a good idea because it allows them to avoid using external websites (in the country I'm from, WhatsApp is the main means of communication).

Of course, it would be very easy to extend this bot for other messaging platforms (e.g., Telegram).

I would have loved to include more features, however I did this project alone in my free time and therefore I didn't have the time to do everything that I wanted. Nonetheless, it was a very good opportunity to learn a lot about Lambda and serverless architecture.

## Architecture Overview

The application follows a serverless microservices architecture using AWS Lambda functions:

```
WhatsApp User → Twilio Webhook → API Gateway → Router Lambda
                                                    ↓
                                      ┌─────────────┼─────────────┐
                                      ↓             ↓             ↓
                              Create Event    List Events    Delete Event
                                Lambda         Lambda         Lambda
                                      ↓             ↓             ↓
                              DynamoDB + S3    DynamoDB      DynamoDB
```

Additional components:
- **Get Event Lambda**: Serves the React app via separate API endpoint
- **React App**: Hosted on S3 + CloudFront for event display

## AWS Lambda Implementation

### Lambda Functions Overview

The bot uses 4 core Lambda functions plus 1 additional function for the web interface:

| Function | Trigger |
|----------|---------|
| Router | API Gateway POST |
| Create Event | Direct invocation |
| List Events | Direct invocation |
| Delete Event | Direct invocation |
| Get Event | API Gateway GET |

### Router Function

- **Trigger**: API Gateway POST endpoint from Twilio webhook
- **Purpose**: Message parsing and Lambda orchestration
- **Why This Approach**: Twilio APIs only allow a single POST endpoint, so I needed to delegate message parsing logic. Rather than creating a monolithic function, I chose a microservices approach for better scalability and maintainability.

### Create Event Function

- **Trigger**: Direct invocation from Router Lambda
- **Process Flow**:
  1. Parse and validate incoming message
  2. If image is included, upload to S3 with unique key
  3. Save event data to DynamoDB with the phone number of the user
  4. Generate shareable link for the event
  5. Return formatted confirmation message

### List Events Function

- **Trigger**: Direct invocation from Router Lambda
- **Purpose**: Returns all events created by a specific user (the phone number identifies a user)
- **Future Enhancement**: Would add geolocation-based filtering

### Delete Event Function

- **Trigger**: Direct invocation from Router Lambda
- **Input**: Event name (unique per phone number)
- **Process**: Removes event from DynamoDB

### Get Event Function

- **Trigger**: API Gateway GET endpoint (`/event/{id}`)
- **Purpose**: Serves event data to React application
- **Response Format**: JSON with event details

## Other AWS Services

### DynamoDB
- **Purpose**: Stores event data

### S3
- **Bucket 1**: Event images with public read access
- **Bucket 2**: Static React application hosting

### CloudFront Distribution
- **Purpose**: CDN for React application with global edge locations

## Future Enhancements

I would have loved to include more features, but unfortunately I didn't have enough time

### Planned Features
- **Amazon Bedrock Integration**: Automatic event information extraction from images using AI
- **Location-Based Discovery**: Find events near user's location