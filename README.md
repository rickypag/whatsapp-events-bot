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

This project answers to one of our daily needs - to connect with one another. More precisely, meet each other and interact at events that speak to us!
In my experience, most people share events they want to go to with their friends in WhatsApp groups. These events are then lost in the conversation history, easy to miss out on.

This is why I developed a WhatsApp bot with this exact purpose: enable users to create events and share them with their peers, in an easy and convenient way. The social media choice - WhatsApp - is due to it being the main means of communication. Nevertheless, the project is adaptable to other messaging platforms, such as Telegram.

The main functionalities are event creation, display, sharing and deleting. As all features are enabled by the AWS Lambda, together with other platforms such as S3 and Dynamo DB, this hackathon also further proves how the AWS ecosystem can be used to create practical solutions to everyday issues.

Of course, it would be very easy to extend this bot for other messaging platforms (e.g., Telegram).

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

Considering the extendibility of the code, I have some features planned

### Planned Features
- **Amazon Bedrock Integration**: Automatic event information extraction from images using AI
- **Location-Based Discovery**: Find events near user's location