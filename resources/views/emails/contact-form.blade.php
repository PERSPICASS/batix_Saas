<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouveau message de contact</title>
    <style>
        body { font-family: sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .header { background: #0f172a; padding: 28px 32px; }
        .header h1 { color: #fbbf24; margin: 0; font-size: 20px; }
        .header p { color: #94a3b8; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #64748b; margin-bottom: 4px; }
        .field p { margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6; }
        .message-box { background: #f8fafc; border-left: 3px solid #fbbf24; border-radius: 4px; padding: 16px; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>{{ __('mail.contact_form.header_title') }}</h1>
            <p>{{ __('mail.contact_form.header_subtitle') }}</p>
        </div>
        <div class="body">
            <div class="field">
                <label>{{ __('mail.contact_form.name_label') }}</label>
                <p>{{ $senderName }}</p>
            </div>
            <div class="field">
                <label>{{ __('mail.contact_form.email_label') }}</label>
                <p><a href="mailto:{{ $senderEmail }}" style="color:#f59e0b;">{{ $senderEmail }}</a></p>
            </div>
            <div class="field">
                <label>{{ __('mail.contact_form.subject_label') }}</label>
                <p>{{ $senderSubject }}</p>
            </div>
            <div class="field">
                <label>{{ __('mail.contact_form.message_label') }}</label>
                <div class="message-box">
                    <p>{{ $senderMessage }}</p>
                </div>
            </div>
        </div>
        <div class="footer">
            {{ __('mail.contact_form.footer', ['appName' => config('app.name')]) }}
        </div>
    </div>
</body>
</html>
