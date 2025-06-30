import boto3
import logging

dynamodb = boto3.resource("dynamodb", region_name='us-east-1')
table = dynamodb.Table("UserEventsTable")
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    request = event['Records'][0]['cf']['request']
    headers = request.get('headers', {})
    uri = request['uri']

    user_agent = headers.get('user-agent', [{'value': ''}])[0]['value'].lower()
    accept = headers.get('accept', [{'value': ''}])[0]['value'].lower()

    is_preview = (
        uri.startswith('/event/') and
        (
            'whatsapp' in user_agent or
            'facebook' in user_agent or
            'twitterbot' in user_agent or
            'linkedinbot' in user_agent or
            'slackbot' in user_agent or
            'discordbot' in user_agent or
            not 'text/html' in accept
        )
    )

    if is_preview:
        event_id = uri.split('/event/')[-1]
        event = get_event(event_id)
        
        meta_tags = f"""
        <meta property=\"og:title\" content=\"{event["name"]}\" />
        <meta property=\"og:description\" content=\"Details about event {event["name"]}.\" />
        <meta property=\"og:image\" content=\"{event["image"]}"\" />
        """ if event else ""

        html = f"""
        <html>
        <head>{meta_tags}</head>
        <body>
            <script>window.location.href = \"/{uri.lstrip('/')}\"</script>
        </body>
        </html>
        """

        return {
            'status': '200',
            'statusDescription': 'OK',
            'headers': {
                'content-type': [ { 'key': 'Content-Type', 'value': 'text/html' } ]
            },
            'body': html,
        }

    # Pass through for other requests
    return request


def get_event(event_id):
    try:
        response = table.get_item(
            Key={'id': event_id},
        )
        item = response.get('Item')
        if not item:
            return None

        return {
            'name': item.get('name', {}).get('S', ''),
            'description': item.get('description', {}).get('S', ''),
            'image': item.get('image', {}).get('S', ''),
        }
    except Exception as e:
        logger.error(f"Error in get item: {str(e)}")
        return None