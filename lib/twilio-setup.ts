import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import 'dotenv/config';

export const generateTwilioCredentials = (stack: cdk.Stack) => {
    const twilioAccountSidValue = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthTokenValue = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_PHONE_NUMBER;

    if(!twilioAccountSidValue) {
        throw new Error("TWILIO_ACCOUNT_SID environment variable must be set.");
    }

    if(!twilioAuthTokenValue) {
        throw new Error("TWILIO_AUTH_TOKEN environment variable must be set.");
    }

    if(!twilioWhatsAppNumber) {
        throw new Error("TWILIO_PHONE_NUMBER environment variable must be set.");
    }
    
    const twilioAccountSid = new ssm.StringParameter(stack, 'TwilioAccountSidParam', {
        parameterName: '/twilio/accountSid',
        stringValue: twilioAccountSidValue
    });

    const twilioAuthToken = new ssm.StringParameter(stack, 'TwilioAuthTokenParam', {
        parameterName: '/twilio/authToken',
        stringValue: twilioAuthTokenValue
    });

    return {
        TWILIO_ACCOUNT_SID: twilioAccountSid.stringValue,
        TWILIO_AUTH_TOKEN: twilioAuthToken.stringValue,
        TWILIO_WHATSAPP_NUMBER: twilioWhatsAppNumber
    }
}