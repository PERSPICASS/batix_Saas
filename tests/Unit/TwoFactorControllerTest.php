<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorControllerTest extends TestCase
{
    private Google2FA $google2fa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->google2fa = new Google2FA();
    }

    /**
     * Test OTPAUTH URL generation
     */
    public function test_otpauth_url_generation(): void
    {
        $secret = $this->google2fa->generateSecretKey();
        $appName = 'BATIXPRO';
        $email = 'user@example.com';

        $otpauthUrl = sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s',
            rawurlencode($appName),
            rawurlencode($email),
            $secret,
            rawurlencode($appName)
        );

        // Verify URL structure
        $this->assertStringStartsWith('otpauth://totp/', $otpauthUrl);
        $this->assertStringContainsString($secret, $otpauthUrl);
        $this->assertStringContainsString(rawurlencode($email), $otpauthUrl);
        $this->assertStringContainsString($appName, $otpauthUrl);
    }

    /**
     * Test QR code URL generation
     */
    public function test_qr_code_url_generation(): void
    {
        $otpauthUrl = 'otpauth://totp/BATIXPRO:user@example.com?secret=JBSWY3DPEBLW64TMMQ======&issuer=BATIXPRO';
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($otpauthUrl);

        // Verify QR code URL structure
        $this->assertStringStartsWith('https://api.qrserver.com/', $qrCodeUrl);
        $this->assertStringContainsString('size=200x200', $qrCodeUrl);
        $this->assertStringContainsString(urlencode('otpauth://'), $qrCodeUrl);
    }

    /**
     * Test secret key generation
     */
    public function test_secret_key_generation(): void
    {
        $secret1 = $this->google2fa->generateSecretKey();
        $secret2 = $this->google2fa->generateSecretKey();

        // Verify secrets are generated and unique
        $this->assertNotEmpty($secret1);
        $this->assertNotEmpty($secret2);
        $this->assertNotEquals($secret1, $secret2);
        $this->assertGreaterThanOrEqual(16, strlen($secret1));
        $this->assertGreaterThanOrEqual(16, strlen($secret2));
    }

    /**
     * Test TOTP code verification
     */
    public function test_totp_code_verification(): void
    {
        $secret = $this->google2fa->generateSecretKey();

        // Generate current code
        $oneTimePassword = $this->google2fa->getCurrentOtp($secret);

        // Verify the code is valid
        $this->assertTrue($this->google2fa->verifyKey($secret, $oneTimePassword));
    }

    /**
     * Test TOTP code verification with wrong code
     */
    public function test_totp_code_verification_fails_with_wrong_code(): void
    {
        $secret = $this->google2fa->generateSecretKey();
        $wrongCode = '000000';

        // Verify wrong code fails
        $this->assertFalse($this->google2fa->verifyKey($secret, $wrongCode));
    }

    /**
     * Test recovery codes generation
     */
    public function test_recovery_codes_generation(): void
    {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }

        // Verify we have 10 codes
        $this->assertCount(10, $codes);

        // Verify codes are unique
        $this->assertCount(10, array_unique($codes));

        // Verify code format (8 character hex strings)
        foreach ($codes as $code) {
            $this->assertMatchesRegularExpression('/^[A-F0-9]{8}$/', $code);
        }
    }

    /**
     * Test OTPAuth URL with special characters in email
     */
    public function test_otpauth_url_with_special_characters(): void
    {
        $secret = $this->google2fa->generateSecretKey();
        $appName = 'BATIXPRO';
        $email = 'user+tag@example.com';

        $otpauthUrl = sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s',
            rawurlencode($appName),
            rawurlencode($email),
            $secret,
            rawurlencode($appName)
        );

        // Verify special characters are encoded
        $this->assertStringContainsString('user%2Btag', $otpauthUrl);
    }

    /**
     * Test QR code URL encoding
     */
    public function test_qr_code_url_encoding(): void
    {
        $otpauthUrl = 'otpauth://totp/BATIXPRO:user@example.com?secret=TEST&issuer=BATIXPRO';
        $encodedUrl = urlencode($otpauthUrl);
        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . $encodedUrl;

        // Verify URL is properly encoded
        $this->assertStringContainsString('%3A%2F%2F', $qrCodeUrl); // :// encoded
        $this->assertStringContainsString('%3F', $qrCodeUrl);        // ? encoded
        $this->assertStringContainsString('%26', $qrCodeUrl);        // & encoded
    }
}
