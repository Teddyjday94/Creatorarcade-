import test from 'node:test';
import assert from 'node:assert/strict';
import { clipUrl } from '../lib/domain/validation.ts';
test('valid video links accepted and unsafe or spoofed sources rejected', () => { for (const u of ['https://clips.twitch.tv/BestClip', 'https://www.twitch.tv/videos/123', 'https://www.youtube.com/watch?v=abcdefghi12', 'https://youtu.be/abcdefghi12', 'https://medal.tv/games/gta-v/clips/abc'])
    assert.ok(clipUrl(u)); for (const u of ['http://youtu.be/abcdefghi12', 'https://youtube.com.evil.test/watch?v=abcdefghi12', 'https://user:pass@youtu.be/abcdefghi12', 'javascript:alert(1)', 'https://youtube.com/', 'https://youtu.be/' + 'a'.repeat(2050)])
    assert.throws(() => clipUrl(u), { status: 422 }); });
