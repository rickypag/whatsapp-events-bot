from typing import Any, Dict
import boto3
import os
import json
import logging
from utils.utils import create_response, send_whatsapp_reply
import urllib.parse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
lambda_client = boto3.client("lambda", region_name=REGION)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        event_body = urllib.parse.parse_qs(event['body'])

        # Extract phone number and message from the body
        phone_number = event_body.get('From', [None])[0]
        # Check also is phone number is in the format "whatsapp:+1234567890"
        if not phone_number:
            logger.error("No phone number found in the message body.")
            return create_response(400, {"error": "Phone number is required."})
        
        logger.info(f"Processing message from number: {phone_number}")
        
        message = event_body.get('Body', [None])[0]

        # Simple routing logic based on keywords
        if message.startswith("Create\n") or message.startswith("create\n"):
            target = os.environ.get("CREATE_EVENT_FUNCTION_ARN")
        elif message.startswith("Delete: "):
            target = os.environ.get("DELETE_EVENT_FUNCTION_ARN")
        elif message == "List" or message == "list":
            target = os.environ.get("MY_EVENTS_FUNCTION_ARN")
        else:
            message = "Sorry, I didn't understand that.\n\n➕*Create*\nIf you want to create an event, please start your message with 'Create' and then add the following information in separate rows:\n-Event name\n-Date\n-Address\n-Description (it can have multiple rows)\n\n➖*Delete*\nIf you want to delete an event, please send 'Delete: <event_name>'.\n\n📋*List*\nIf you want to list your events, please send 'List'."
            return send_whatsapp_reply(phone_number, message)

        # Invoke the chosen Lambda
        lambda_client.invoke(
            FunctionName=target,
            InvocationType='RequestResponse',
            Payload=json.dumps(event).encode('utf-8')
        )

        # result = json.loads(response['Payload'].read())
        return create_response(200, "Lamdba invoked successfully")
    except Exception as e:
        logger.error(f"Error in router: {str(e)}")
        return send_whatsapp_reply(phone_number, message)
