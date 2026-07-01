<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de vérification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(to bottom, #1e293b, #0f172a);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #0f172a;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            color: #1e293b;
            font-size: 14px;
            font-weight: 500;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #f1f5f9;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .message {
            font-size: 15px;
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .code-container {
            background: rgba(252, 211, 77, 0.1);
            border: 2px solid #fcd34d;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 14px;
            color: #fcd34d;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .code {
            font-size: 48px;
            font-weight: 700;
            color: #fcd34d;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 0 20px rgba(252, 211, 77, 0.3);
        }
        .expiry {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 15px;
            font-style: italic;
        }
        .warning {
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .warning p {
            font-size: 14px;
            color: #fca5a5;
            line-height: 1.6;
        }
        .warning strong {
            color: #ef4444;
        }
        .footer {
            background: rgba(15, 23, 42, 0.5);
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .footer p {
            font-size: 13px;
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        .footer a {
            color: #fcd34d;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
            margin: 25px 0;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            .container {
                border-radius: 12px;
            }
            .header {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 30px 20px;
            }
            .code {
                font-size: 36px;
                letter-spacing: 6px;
            }
            .code-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ __('mail.verification_code.header_title') }}</h1>
            <p>{{ config('app.name') }}</p>
        </div>

        <div class="content">
            <p class="greeting">{{ __('mail.verification_code.greeting', ['salutation' => __('mail.common.salutation'), 'name' => $userName]) }}</p>

            <p class="message">
                {{ __('mail.verification_code.intro', ['appName' => config('app.name')]) }}
            </p>
            
            <div class="code-container">
                <div class="code-label">{{ __('mail.verification_code.code_label') }}</div>
                <div class="code">{{ $verificationCode }}</div>
                <p class="expiry">{{ __('mail.verification_code.code_expiry') }}</p>
            </div>

            <p class="message">
                {{ __('mail.verification_code.instruction', ['appName' => config('app.name')]) }}
            </p>
            
            <div class="divider"></div>
            
            <div class="warning">
                <p>
                    <strong>{{ __('mail.verification_code.warning_title') }}</strong> {{ __('mail.verification_code.warning_message', ['appName' => config('app.name')]) }}
                </p>
            </div>

            <p class="message" style="margin-top: 25px; font-size: 14px;">
                {{ __('mail.verification_code.security_note') }}
            </p>
        </div>
        
        <div class="footer">
            <p>
                {{ __('mail.verification_code.footer_automatic') }}<br>
                {{ __('mail.verification_code.footer_support') }} :
                <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
            </p>
            <p style="margin-top: 15px;">
                &copy; {{ date('Y') }} {{ config('app.name') }}. {{ __('mail.common.copyright') }}
            </p>
        </div>
    </div>
</body>
</html>
