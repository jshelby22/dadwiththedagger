import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Pages workflow verifies content and browser behavior before publishing only the site', () => {
  const workflow = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:browser/);
  assert.match(workflow, /path: site\n/);
  for (const match of workflow.matchAll(/uses: (.+)/g)) {
    assert.match(match[1], /^actions\/[a-z-]+@[0-9a-f]{40}(?:\s|$)/);
  }
});
