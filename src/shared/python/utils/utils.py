import json
import os
import logging
from typing import Any, Dict
from twilio.rest import Client

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def send_whatsapp_reply(to_number, message):
    return_message = "Message sent successfully."
    try:
        account_sid = os.environ["TWILIO_ACCOUNT_SID"]
        auth_token = os.environ["TWILIO_AUTH_TOKEN"]
        from_whatsapp_number = os.environ["TWILIO_WHATSAPP_NUMBER"]

        client = Client(account_sid, auth_token)

        logger.info(f"Sending WhatsApp message to {to_number}: {message}")
        message = client.messages.create(
            from_=from_whatsapp_number,
            body=message,
            to=to_number
        )
    except Exception as e:
        logger.error(f"It was not possible to send the WhatsApp message. {e}")
        return_message = "Failed to send message."
    return create_response(200, return_message)
    
def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a standardized HTTP response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(body)
    }