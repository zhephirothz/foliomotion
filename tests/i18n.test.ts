import test from 'node:test';
import assert from 'node:assert/strict';
import {
  translations,
  getTranslation,
  LANGUAGE_STORAGE_KEY,
  type TranslationKey,
  type Language,
} from '../src/i18n.ts';

test('i18n: storage key constant is defined and stable', () => {
  assert.equal(LANGUAGE_STORAGE_KEY, 'folio-motion-lang-v1');
});

test('i18n: en and th dictionaries have identical keys', () => {
  const enKeys = Object.keys(translations.en).sort();
  const thKeys = Object.keys(translations.th).sort();

  assert.deepEqual(
    enKeys,
    thKeys,
    'English and Thai translation dictionaries must define the exact same keys'
  );
  assert.ok(enKeys.length > 50, `Expected comprehensive translations, found ${enKeys.length} keys`);
});

test('i18n: all translation strings are non-empty', () => {
  for (const lang of ['en', 'th'] as Language[]) {
    const dict = translations[lang];
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(
        typeof value === 'string' && value.trim().length > 0,
        `Translation key "${key}" in language "${lang}" must not be empty`
      );
    }
  }
});

test('i18n: getTranslation retrieves correct language strings', () => {
  assert.equal(getTranslation('en', 'studio'), 'Studio');
  assert.equal(getTranslation('th', 'studio'), 'สตูดิโอ');

  assert.equal(getTranslation('en', 'allChangesSaved'), 'All changes saved');
  assert.equal(getTranslation('th', 'allChangesSaved'), 'บันทึกการเปลี่ยนแปลงทั้งหมดแล้ว');

  assert.equal(getTranslation('en', 'exportFilm'), 'Export film');
  assert.equal(getTranslation('th', 'exportFilm'), 'ส่งออกวิดีโอ');
});

test('i18n: parameter replacement interpolates dynamic values', () => {
  const enResult = getTranslation('en', 'categoryAdded', { name: 'Branding' });
  assert.equal(enResult, 'Category "Branding" added to master data.');

  const thResult = getTranslation('th', 'categoryAdded', { name: 'Branding' });
  assert.equal(thResult, 'เพิ่มหมวดหมู่ "Branding" เข้าสู่ข้อมูลหลักแล้ว');

  const enExport = getTranslation('en', 'exportReady', { time: '8.5' });
  assert.equal(enExport, 'Your portfolio film (8.5s) is ready. The MP4 has been downloaded.');

  const thExport = getTranslation('th', 'exportReady', { time: '8.5' });
  assert.equal(thExport, 'วิดีโอผลงานของคุณ (8.5 วิ) พร้อมแล้ว ดาวน์โหลดไฟล์ MP4 เรียบร้อย');
});

test('i18n: handles multiple occurrences or missing parameters gracefully', () => {
  const res = getTranslation('en', 'maxScreenshotsNote', { max: 12 });
  assert.equal(res, 'This film can show up to 12 screenshots. Remove one to add another.');

  // Without parameter, token remains or doesn't throw
  const withoutParam = getTranslation('en', 'maxScreenshotsNote');
  assert.equal(withoutParam, 'This film can show up to {max} screenshots. Remove one to add another.');
});
