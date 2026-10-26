import '@testing-library/jest-dom';

process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_characters_long_for_security_checks_12345';
process.env.MONGODB_URI = 'mongodb://localhost:27017/tea_platform_test';
