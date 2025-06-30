import logging
import boto3
import os
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
# lambda_client = boto3.client('lambda', region_name=REGION)

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parse the WhatsApp message from API Gateway event
        message_data = parse_whatsapp_message(event)
        
        if not message_data:
            return create_response(400, {"error": "Invalid message format"})
        
        message_text = message_data.get('text', '').lower().strip()
        sender = message_data.get('sender')
        
        logger.info(f"Processing message: '{message_text}' from {sender}")
        
        # Route based on message content
        if message_text.startswith('create'):
            handler = CreateHandler()
            result = handler.handle(message_data)
        elif message_text.startswith('list'):
            handler = ListHandler()
            result = handler.handle(message_data)
        body = json.loads(event['body'])
        message = body.get('Body', '').lower()

        # Simple routing logic based on keywords
        if "create" in message:
            print("CREATE_EVENT_FUNCTION_ARN", os.environ.get('CREATE_EVENT_FUNCTION_ARN'))
            target = os.environ.get('CREATE_EVENT_FUNCTION_ARN')
        else:
            result = {
                "message": "Unknown command. Use 'create' or 'list'",
                "success": False
            }
        
        return create_response(200, result)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {"error": "Internal server error"})