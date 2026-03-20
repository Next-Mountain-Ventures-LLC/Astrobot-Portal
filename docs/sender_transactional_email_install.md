# Sender Transactional Email Installation Guide

> **Status**: Complete integration guide for setting up Sender transactional email system on Astro/Builder.io websites
> **Last Updated**: March 2026
> **For**: AI agents installing transactional email on new projects

---

## ⚠️ CRITICAL INSTRUCTIONS FOR AI AGENTS

**This is a living document.** You MUST follow these rules:

1. **During Debugging**: If you discover that instructions in this file are incomplete, incorrect, or need updating based on debugging experience, UPDATE THIS FILE IMMEDIATELY.

2. **No Permission Required**: Do NOT ask the user "should I update the file?" - just update it. The user has explicitly requested automatic updates.

3. **Document Changes**: When you find a fix or correction:
   - Update the relevant section
   - Update the troubleshooting section if applicable
   - Update the Version History at the bottom with today's date
   - Always add a note explaining what was fixed

4. **Keep It Accurate**: Every time you use this file for a new installation, check if previous debugging sessions revealed issues. If they did, make sure the file reflects the correct solution.

5. **Examples**:
   - Found that template variable names need special format? Update the example.
   - Discovered a new error during testing? Add it to Troubleshooting.
   - Found a configuration step was missing? Add it to the installation steps.
   - Realized the code needs a different API parameter? Fix the code examples.

6. **Version Control**: Update the version history table at the end of this document every time you make changes.

This keeps the file reliable for future installations and saves time by avoiding the same mistakes.

---

---

## Overview

This guide enables your website to send **transactional emails** via the Sender.net API. Transactional emails are triggered by specific website events (form submissions, contact inquiries, order confirmations, etc.) and sent to specified recipients using Sender's template system.

**What This Provides**:
- Automated email delivery based on website events
- Template-based email formatting in Sender
- Email delivery to admins and/or users
- Full integration with Astro/Builder.io websites
- Environment variable configuration in Netlify

---

## Prerequisites

Before starting, you need:

1. **Active Sender.net Account** with:
   - API Key (Bearer token)
   - At least one email template created in Sender
   - Template ID (found in Sender dashboard)

2. **Netlify Project** with environment variable access

3. **Astro Project** with:
   - `@astrojs/netlify` adapter
   - TypeScript support
   - Working API routes (`src/pages/api/`)

---

## Critical Information to Gather

Your AI agent **MUST** ask the user for these details before proceeding:

### 1. **Sender API Credentials**
- [ ] Sender.net API Key (Bearer token)
- [ ] Ask: "What is your Sender.net API key?" 
- [ ] Validate: Must be a long string (40+ characters)

### 2. **Email Template Configuration**
- [ ] Template ID in Sender (e.g., "ejnkvR")
- [ ] Ask: "What is your Sender transactional email template ID?"
- [ ] Ask: "What template variables does this template expect?" (e.g., firstname, lastname, email, notes, subject)
- [ ] Template location: Sender dashboard → Templates → View/Edit template → ID shown in browser or URL

### 3. **Trigger Events**
- [ ] Ask: "What website events should trigger transactional emails?"
- [ ] Examples:
  - Form submissions (contact forms, newsletter signups)
  - Contact inquiries
  - Support requests
  - E-commerce orders
  - Account registrations
- [ ] For each event:
  - [ ] Ask: "What is the endpoint or component that handles this event?"
  - [ ] Ask: "What recipient email should receive this?" (admin email or user email?)
  - [ ] Ask: "What information from the event should be included in the email?"

### 4. **Email Recipients**
- [ ] Admin notification email (where should confirmation emails go?)
- [ ] Ask: "What admin email should receive notifications?" (e.g., admin@example.com)
- [ ] User notification email (should users get copies? Yes/No?)

### 5. **Website Configuration**
- [ ] Domain/site name (for email subject lines)
- [ ] Contact form endpoint (if applicable)
- [ ] Any custom field mappings

---

## Step-by-Step Installation

### Step 1: Create Email Template in Sender (User Must Do)

1. **Log into Sender.net** at https://app.sender.net/
2. **Navigate to**: Templates → Create New Template
3. **Template Type**: Select "Transactional Email"
4. **Template Name**: Something descriptive (e.g., "Contact Form Confirmation")
5. **Email Subject**: Set default subject (can be overridden per send)
6. **Template Variables** (CRITICAL - User must define these):
   - Each template variable appears as `{variable_name}` in the template
   - Common transactional email variables:
     - `firstname` - Recipient first name
     - `lastname` - Recipient last name
     - `email` - Recipient email address
     - `subject` - Email subject
     - `notes` - Message content
     - `message` - Alternative to notes
     - `phone` - Phone number
     - `timestamp` - When submitted
   - **User must specify**: What variables THEIR template uses
7. **Save Template**
8. **Copy Template ID**: 
   - Open template
   - URL will show `/templates/{ID}`
   - Or view template details for ID display
   - Save this ID for Netlify environment variables

**⚠️ CRITICAL**: Different templates may have different variable names. Confirm exact variable names with the user.

---

### Step 2: Create API Endpoint

Create file: `src/pages/api/send-email.ts`

```typescript
import type { APIRoute } from "astro";

interface EmailData {
  recipient_email: string;
  variables: Record<string, string>;
  [key: string]: any;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json() as EmailData;

    // Get configuration from environment
    const SENDER_API_KEY = process.env.SENDER_API_KEY;
    const SENDER_TEMPLATE_ID = process.env.SENDER_TEMPLATE_ID;
    const SENDER_API_BASE = "https://api.sender.net/v2";

    if (!SENDER_API_KEY || !SENDER_TEMPLATE_ID) {
      console.error("❌ [EMAIL API] Missing Sender configuration");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    if (!data.recipient_email || !data.variables) {
      console.error("❌ [EMAIL API] Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "recipient_email and variables are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("📧 [EMAIL API] Sending transactional email");
    console.log(`   Recipient: ${data.recipient_email}`);
    console.log(`   Template: ${SENDER_TEMPLATE_ID}`);
    console.log(`   Variables:`, data.variables);

    // Send email via Sender API
    const response = await fetch(
      `${SENDER_API_BASE}/message/${SENDER_TEMPLATE_ID}/send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_email: data.recipient_email,
          variables: data.variables,
          attachments: {},
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ [EMAIL API] Sender returned status ${response.status}`
      );
      console.error(`   Response: ${errorText}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Email service error: ${response.status}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const responseData = await response.json();
    console.log("✅ [EMAIL API] Email sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [EMAIL API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

---

### Step 3: Create Email Helper Module

Create file: `src/lib/transactionalEmail.ts`

```typescript
/**
 * Transactional Email Helper
 * Sends emails via Sender template API
 */

export interface TransactionalEmailPayload {
  recipient_email: string;
  variables: Record<string, string>;
}

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("📧 [TRANSACTIONAL EMAIL] Preparing to send");
    console.log(`   Recipient: ${payload.recipient_email}`);
    console.log(`   Variables:`, payload.variables);

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as { success: boolean; error?: string };

    if (result.success) {
      console.log("✅ [TRANSACTIONAL EMAIL] Sent successfully");
      return { success: true };
    } else {
      console.error("❌ [TRANSACTIONAL EMAIL] Failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("❌ [TRANSACTIONAL EMAIL] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

### Step 4: Integrate with Trigger Events

**Example: Contact Form Submission**

In your contact form handler or API endpoint, after successful processing:

```typescript
import { sendTransactionalEmail } from "@/lib/transactionalEmail";

// After form is validated and processed...

// Send confirmation email to user
await sendTransactionalEmail({
  recipient_email: userEmail,
  variables: {
    firstname: firstName,
    lastname: lastName,
    email: userEmail,
    subject: "We received your message",
    notes: `Thank you for contacting us. We received your message: "${messageContent}"`,
  },
});

// Send notification to admin
await sendTransactionalEmail({
  recipient_email: adminEmail,
  variables: {
    firstname: "Admin",
    lastname: "",
    email: adminEmail,
    subject: `New contact form submission from ${firstName} ${lastName}`,
    notes: messageContent,
  },
});
```

**Other Event Examples**:
- E-commerce order: Send receipt with order details
- Newsletter signup: Send welcome email
- Account registration: Send verification link
- Support ticket: Send ticket confirmation

---

### Step 5: Configure Netlify Environment Variables

The AI agent **MUST** walk the user through this process:

1. **Go to Netlify Dashboard** → Select your site
2. **Navigate to**: Site Settings → Build & Deploy → Environment
3. **Click**: "Add a new variable"
4. **Add these three variables**:

| Variable Name | Value | Description |
|---|---|---|
| `SENDER_API_KEY` | (User's API key) | Bearer token from Sender.net account |
| `SENDER_TEMPLATE_ID` | (User's template ID) | Template ID from Sender dashboard |
| `SENDER_API_BASE` | `https://api.sender.net/v2` | Sender API endpoint (same for all) |

**Steps to add each variable**:
1. Click "Add a new variable"
2. Enter the variable name (exactly as shown above)
3. Enter the value
4. Click "Add"
5. Repeat for all three variables

**⚠️ SECURITY WARNING**:
- Never commit these values to git
- Never share the API key
- Use Netlify UI only for secrets
- Do NOT add to `netlify.toml` in git

---

### Step 6: Test the Integration

1. **Make a code change** and push to trigger build
2. **Test the trigger event**:
   - Fill out form or trigger the event
   - Check browser console for errors
3. **Check Netlify Function logs**:
   - Netlify Dashboard → Functions → ssr
   - Look for `📧 [EMAIL API]` logs
   - Should see: `✅ [EMAIL API] Email sent successfully`
4. **Verify email delivery**:
   - Check inbox for recipient email
   - Check spam/promotions folder
5. **Check Sender dashboard**:
   - Sender → Reports → View delivery status
   - Confirm template was used

---

## Troubleshooting

### Issue: "Email service not configured"
**Solution**: Verify all three environment variables are set in Netlify:
- SENDER_API_KEY (check it's not empty)
- SENDER_TEMPLATE_ID (check correct template ID)
- SENDER_API_BASE (should be https://api.sender.net/v2)

### Issue: "Email service error: 400"
**Possible causes**:
- Template ID is incorrect
- Template variables don't match (e.g., template expects `firstname` but you're sending `first_name`)
- Required template variable is missing from the payload
**Solution**: 
- Verify template ID in Sender dashboard
- Check template variable names match exactly
- Ensure all required variables are included in the API call

### Issue: "Email service error: 401"
**Cause**: API key is invalid or expired
**Solution**:
- Verify API key in Sender dashboard (Integrations → API Keys)
- Copy full API key
- Update SENDER_API_KEY in Netlify environment

### Issue: Emails not being sent but no errors in logs
**Possible causes**:
- Template ID is wrong (silently fails)
- Recipient email is invalid
- Sender spam filters are catching it
**Solution**:
- Check Sender dashboard Reports tab for delivery status
- Verify recipient email format is valid
- Test with a different recipient email
- Check spam/promotions folders

### Issue: Template variables not populating in email
**Cause**: Variable names don't match between code and template
**Solution**:
1. Open template in Sender
2. Look at template body - variables appear as `{variable_name}`
3. Ensure code sends EXACT variable names
4. Variable names are case-sensitive

---

## Integration Checklist

Before considering installation complete:

- [ ] Sender.net account created and active
- [ ] Email template created with defined variables
- [ ] Template ID copied and documented
- [ ] `src/pages/api/send-email.ts` created
- [ ] `src/lib/transactionalEmail.ts` created
- [ ] Trigger event handler updated with sendTransactionalEmail() call
- [ ] All three environment variables added to Netlify
- [ ] Site rebuilt successfully
- [ ] Trigger event tested (form submitted, etc.)
- [ ] Email received in inbox
- [ ] Sender dashboard shows successful delivery
- [ ] No errors in Netlify Function logs

---

## FAQ

**Q: Can I send to multiple recipients?**
A: Make separate API calls to `/api/send-email` for each recipient. Example:
```typescript
// Send to user
await sendTransactionalEmail({ recipient_email: userEmail, variables: {...} });
// Send to admin
await sendTransactionalEmail({ recipient_email: adminEmail, variables: {...} });
```

**Q: Can I use different templates for different events?**
A: Yes. Create multiple templates in Sender, get each template ID, add to Netlify environment (e.g., SENDER_TEMPLATE_ID_CONTACT, SENDER_TEMPLATE_ID_ORDER). Modify `send-email.ts` to accept template ID as a parameter.

**Q: What if I want to include attachment data?**
A: The current implementation has `attachments: {}` in the payload. Check Sender API docs for attachment format if needed.

**Q: Do I need to wait for the email to send before responding to the user?**
A: No. You can send the email and immediately respond to the user. The API call is non-blocking:
```typescript
// Send email (don't await)
sendTransactionalEmail({ ... }).catch(error => console.error(error));
// Respond to user immediately
return new Response(JSON.stringify({ success: true }), { status: 200 });
```

**Q: What email address appears in the "From:" field?**
A: The from address is configured in your Sender template. It cannot be overridden per email.

---

## Related Documentation

- [Sender.net API Documentation](https://api.sender.net/docs/)
- [Sender Templates Guide](https://help.sender.net/en/collections/email-templates)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/astro-components/#server-endpoints)

---

## Version History

**AI Agent: Update this table EVERY TIME you make changes to this document during debugging.**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial installation guide - based on working Sender integration with contact forms and transactional email |
| 1.1 | *[Update when first fix is made]* | *[Describe fix and what section was updated]* |

### How to Update Version History:
1. Increment the version number by 0.1
2. Add today's date
3. Describe exactly what was fixed/changed and which section(s)
4. Example: "Fixed template variable format in Step 3 - variables must use underscore_case, not camelCase"

---
