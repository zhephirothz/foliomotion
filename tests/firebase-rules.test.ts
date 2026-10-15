import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { initialProject } from '../src/types.ts';

test('Firebase rules isolate accounts and reject guest writes and invalid attachments', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  const env = await initializeTestEnvironment({ projectId: 'demo-folio-motion', firestore: { host: '127.0.0.1', port: 8085, rules: await readFile('firestore.rules', 'utf8') }, storage: { host: '127.0.0.1', port: 9199, rules: await readFile('storage.rules', 'utf8') } });
  try {
    const alice = env.authenticatedContext('alice'); const bob = env.authenticatedContext('bob'); const guest = env.unauthenticatedContext();
    const anonymous = env.authenticatedContext('anonymous-user', { firebase: { sign_in_provider: 'anonymous' } });
    const path = 'users/alice/projects/project';
    const data = { project: initialProject, updatedAt: Date.now() };
    await assertSucceeds(setDoc(doc(alice.firestore(), path), data));
    await assertSucceeds(getDoc(doc(alice.firestore(), path)));
    await assertFails(getDoc(doc(bob.firestore(), path)));
    await assertFails(setDoc(doc(bob.firestore(), path), data));
    await assertFails(getDoc(doc(guest.firestore(), path)));
    await assertFails(setDoc(doc(guest.firestore(), path), data));
    await assertFails(setDoc(doc(alice.firestore(), path), { ...data, project: { ...initialProject, screenshots: Array(11).fill({}) } }));
    await assertFails(setDoc(doc(anonymous.firestore(), 'users/anonymous-user/projects/project'), data));
    const image = 'users/alice/projects/project/attachments/shot';
    await assertSucceeds(uploadBytes(ref(alice.storage(), image), new Uint8Array([1,2,3]), { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(alice.storage(), image)));
    await assertFails(getBytes(ref(bob.storage(), image)));
    await assertFails(uploadBytes(ref(guest.storage(), image), new Uint8Array([1]), { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(alice.storage(), image), new Uint8Array([1]), { contentType: 'text/html' }));
  } finally { await env.cleanup(); }
});
