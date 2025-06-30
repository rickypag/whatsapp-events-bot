import uuid
import boto3
import os
import logging
from boto3.dynamodb.conditions import Attr
import urllib.parse
from utils.utils import send_whatsapp_reply

import requests
from io import BytesIO

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
FRONTEND_URL = os.environ.get("FRONTEND_URL")
EVENT_POSTERS_S3_BUCKET = os.environ.get("EVENT_POSTERS_S3_BUCKET")
S3_ENDPOINT = os.environ.get("S3_ENDPOINT")

dynamodb = boto3.resource("dynamodb", endpoint_url=os.environ.get("DYNAMO_ENDPOINT"))
table = dynamodb.Table(os.environ.get("EVENTS_TABLE_NAME"))

s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT
)

def handler(event, context):
    event_body = urllib.parse.parse_qs(event['body'])
    from_number = event_body.get('From', [None])[0]
    media_url = event_body.get('MediaUrl0', [None])[0]
    send_whatsapp_reply(from_number, "We received your message. Creating your event...")

    event_id = str(uuid.uuid4())

    # 1. We get image from the URL
    s3_key = None
    if media_url:
        image_data = BytesIO(download_image_from_twilio(media_url))
        s3_key = f"event_{event_id}.jpg"
        s3.upload_fileobj(image_data, EVENT_POSTERS_S3_BUCKET, s3_key)

    event_item = process_event(event_body.get('Body', [None])[0])
    event_item["id"] = event_id
    if s3_key:
        event_item["image_url"] = f"https://{EVENT_POSTERS_S3_BUCKET}.s3.us-east-1.amazonaws.com/{s3_key}"
    event_item["user_phone"] = from_number

    response = table.scan(
        FilterExpression=Attr("user_phone").eq(from_number) & Attr("name").eq(event_item["name"])
    )
    items = response['Items']
    if len(items) > 0:
        message = "You already created an event with this name. Please choose a different name."
        return send_whatsapp_reply(from_number, message)
        
    table.put_item(Item=event_item)

    message = f"*{event_item['name']}*\n🕒 {event_item['date']}\n📍 {event_item['address']}\n\n{event_item['description']}\n\n\nFor more information, visit: https://{FRONTEND_URL}/event/{event_id}"
    return send_whatsapp_reply(from_number, message)

def download_image_from_twilio(media_url):
    account_sid = os.environ['TWILIO_ACCOUNT_SID']
    auth_token = os.environ['TWILIO_AUTH_TOKEN']

    response = requests.get(media_url, auth=(account_sid, auth_token))
    response.raise_for_status()
    
    return response.content  # this is binary image data

def process_event(event_data):
    """
    Process the event data
    """

    data = event_data.split("\n")
    if len(data) < 4:
        return {
            "status": "error",
            "message": "Invalid event data format. Expected at least 3 lines."
        }
    name = data[1].strip()
    date = data[2].strip()
    address = data[3].strip()
    
    description = ""
    if len(data) >= 4:
        description = "\n".join(data[4:])
    
    return {
        "name": name,
        "date": date,
        "address": address,
        "description": description
    }