import boto3
import os
import logging
from boto3.dynamodb.conditions import Attr
import urllib.parse
from utils.utils import send_whatsapp_reply

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
dynamodb = boto3.resource("dynamodb", endpoint_url=os.environ.get("DYNAMO_ENDPOINT"))
table = dynamodb.Table(os.environ.get("EVENTS_TABLE_NAME"))


# {
#   "body": "From=whatsapp:+393473843886&Body=Delete: Partyyy"
# }

def handler(event, context):
    event_body = urllib.parse.parse_qs(event['body'])
    from_number = event_body.get('From', [None])[0]

    name = event_body.get('Body', [None])[0].split("Delete: ", 1)[1]
    logger.info(f"Deleting event with name '{name}' for user {from_number}")

    response = table.scan(
        FilterExpression=Attr("user_phone").eq(from_number) & Attr("name").eq(name)
    )
    items = response['Items']
    message = ""
    if len(items) == 0:
        message = "You have no events created yet. Please create an event first. 2"
        return send_whatsapp_reply(from_number, message)
    else:
        table.delete_item(Key={"id": items[0]["id"]})
    message = "Event deleted successfully."
    return send_whatsapp_reply(from_number, message)
