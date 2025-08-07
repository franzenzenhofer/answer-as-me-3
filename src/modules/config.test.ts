import '../modules/config';

describe('Config Module', () => {
  it('should have APP_NAME defined', () => {
    expect(Config.APP_NAME).toBe('Answer As Me 3');
  });

  it('should have VERSION placeholder', () => {
    expect(Config.VERSION).toBe('__VERSION__');
  });

  it('should have SETTINGS with defaults', () => {
    expect(Config.SETTINGS.DEFAULT_GREETING).toBe('Hello World');
    expect(Config.SETTINGS.MAX_RETRIES).toBe(3);
    expect(Config.SETTINGS.TIMEOUT_MS).toBe(5000);
  });

  it('should have COLORS defined', () => {
    expect(Config.COLORS.PRIMARY).toBe('#4285F4');
    expect(Config.COLORS.SUCCESS).toBe('#34A853');
    expect(Config.COLORS.WARNING).toBe('#FBBC05');
    expect(Config.COLORS.ERROR).toBe('#EA4335');
  });
});