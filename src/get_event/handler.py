import boto3
import os
import json

REGION = os.environ.get("AWS_REGION")
dynamodb = boto3.resource("dynamodb", endpoint_url=os.environ.get("DYNAMO_ENDPOINT"))
table = dynamodb.Table(os.environ.get("EVENTS_TABLE_NAME"))

def handler(event, context):
    event_id = event['pathParameters']['id']
    
    response = table.get_item(
        Key={'id': event_id},
    )
    item = response.get('Item')
    if item:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({
                'id': item.get('id'),
                'name': item.get('name', ""),
                'description': item.get('description', ""),
                'address': item.get('address', ""),
                'date': item.get('date', ""),
                'image_url': item.get('image_url', "")
            })
        }
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': json.dumps({'error': 'Event not found'})
        }
