import base64
import json
import boto3
import os

# bedrock = boto3.client('bedrock-runtime', region_name=os.environ['AWS_REGION'])

def lambda_handler(event, context):
    return {
        "statusCode": 200
    }
    # body = event.get('body')
    # if event.get('isBase64Encoded'):
    #     body = base64.b64decode(body).decode('utf-8')
    # data = json.loads(body)

    # user_message = data.get("Body", "Hi")
    # sender = data.get("From", "unknown")

    # prompt = f"\n\nHuman: Summarize this WhatsApp message: \"{user_message}\"\n\nAssistant:"
    # payload = {
    #     "prompt": prompt,
    #     "max_tokens_to_sample": 200,
    #     "temperature": 0.7,
    #     "top_k": 250,
    #     "top_p": 1,
    #     "stop_sequences": ["\n\nHuman:"]
    # }

    # response = bedrock.invoke_model(
    #     modelId="anthropic.claude-v2",  # Adjust model ID as needed
    #     body=json.dumps(payload),
    #     contentType="application/json",
    #     accept="application/json"
    # )

    # result = json.loads(response['body'].read())
    # return {
    #     "statusCode": 200,
    #     "body": json.dumps({
    #         "from": sender,
    #         "original": user_message,
    #         "summary": result['completion']
    #     }),
    #     "headers": {
    #         "Content-Type": "application/json"
    #     }
    # }
