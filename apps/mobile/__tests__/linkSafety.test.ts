import {
  isSuspiciousLink,
  splitLinks,
  toOpenableUrl,
} from '../src/features/messages/linkSafety';

describe('chat links', () => {
  it('splits text into plain parts and links, without trailing punctuation', () => {
    expect(splitLinks('Xem ở https://vnexpress.net/abc, hay www.tuoitre.vn.')).toEqual([
      { text: 'Xem ở ' },
      { text: 'https://vnexpress.net/abc', url: 'https://vnexpress.net/abc' },
      { text: ', hay ' },
      { text: 'www.tuoitre.vn', url: 'www.tuoitre.vn' },
      { text: '.' },
    ]);
    expect(splitLinks('vào shopee.vn/sale nhé')).toEqual([
      { text: 'vào ' },
      { text: 'shopee.vn/sale', url: 'shopee.vn/sale' },
      { text: ' nhé' },
    ]);
  });

  it('leaves plain text, email addresses and numbers alone', () => {
    expect(splitLinks('Chào bạn, hẹn 9.30 nhé')).toEqual([{ text: 'Chào bạn, hẹn 9.30 nhé' }]);
    expect(splitLinks('mail mình: ten@gmail.com')).toEqual([{ text: 'mail mình: ten@gmail.com' }]);
    expect(splitLinks('')).toEqual([]);
  });

  it('opens scheme-less links over https', () => {
    expect(toOpenableUrl('www.tuoitre.vn')).toBe('https://www.tuoitre.vn');
    expect(toOpenableUrl('http://abc.com')).toBe('http://abc.com');
  });

  it('accepts ordinary https links and the real bank domains', () => {
    for (const url of [
      'https://vnexpress.net/abc',
      'www.tuoitre.vn',
      'https://docs.google.com/document/d/1',
      'https://portal.vietcombank.com.vn/login',
      'https://momo.vn',
      'https://www.techcombank.com/ca-nhan',
      'shopee.vn/sale',
    ]) {
      expect([url, isSuspiciousLink(url)]).toEqual([url, false]);
    }
  });

  it('flags plain http, raw IPs, punycode and non-Latin hosts, and hidden hosts', () => {
    for (const url of [
      'http://example.com',
      'https://103.21.4.5/login',
      'https://xn--vietcmbank-abc.com',
      'https://vietcоmbank.com', // Cyrillic "о"
      'https://vietcombank.com.vn@evil.top/login',
      'https://[2001:db8::1]/',
    ]) {
      expect([url, isSuspiciousLink(url)]).toEqual([url, true]);
    }
  });

  it('flags URL shorteners and off-app chat links (same hosts the server blocks)', () => {
    for (const url of ['https://bit.ly/3abc', 'tinyurl.com/x', 'https://t.me/kiemtien', 'zalo.me/0912345678']) {
      expect([url, isSuspiciousLink(url)]).toEqual([url, true]);
    }
  });

  it('flags bank and e-wallet lookalikes', () => {
    for (const url of [
      'https://vietcombank-xacthuc.top/dang-nhap',
      'https://vietc0mbank.vn',
      'https://rnomo-hoantien.com',
      'https://vietcombank.com.vn.secure-login.xyz',
      'https://mb-bank.online',
    ]) {
      expect([url, isSuspiciousLink(url)]).toEqual([url, true]);
    }
  });
});
