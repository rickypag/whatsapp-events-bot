import boto3
import os
import json
from boto3.dynamodb.conditions import Attr
import urllib.parse
from utils.utils import send_whatsapp_reply


REGION = os.environ.get("AWS_REGION", "us-east-1")
FRONTEND_URL = os.environ.get("FRONTEND_URL")
dynamodb = boto3.resource("dynamodb", endpoint_url=os.environ.get("DYNAMO_ENDPOINT"))
table = dynamodb.Table(os.environ.get("EVENTS_TABLE_NAME"))

def handler(event, context):
    event_body = urllib.parse.parse_qs(event['body'])
    from_number = event_body.get('From', [None])[0]

    response = table.scan(
        FilterExpression=Attr("user_phone").eq(from_number)
    )
    items = response['Items']
    message = ""
    if not items:
        message = "You have no events created yet. Please create an event first."
    else:
        message = "Here are your events:\n\n"
        for item in items:
            message += f"*{item['name']}*\nlink: https://{FRONTEND_URL}/event/{item['id']}\n\n"
    message = message.strip()
    return send_whatsapp_reply(from_number, message)
