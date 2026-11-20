// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fsOverride = vi.hoisted(() => ({ readdirSync: null }));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readdirSync: (...args) => (fsOverride.readdirSync ?? actual.readdirSync)(...args),
  };
});

const { PRODUCTION_CLOUD_NAME, findLeakingEnvFiles, run } =
  await import('./check-cloudinary-env.mjs');
const SCRIPT_PATH = path.resolve(import.meta.dirname, 'check-cloudinary-env.mjs');

describe('check-cloudinary-env', () => {
  let root;
  let dirA;
  let dirB;

  const write = (dir, name, content) => writeFileSync(path.join(dir, name), content);

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'cld-env-'));
    dirA = path.join(root, 'a');
    dirB = path.join(root, 'b');
    mkdirSync(dirA);
    mkdirSync(dirB);
  });

  afterEach(() => {
    fsOverride.readdirSync = null;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  describe('findLeakingEnvFiles', () => {
    it('flags non-production env files that contain the production cloud name', () => {
      write(dirA, '.env', `CLOUD=${PRODUCTION_CLOUD_NAME}`);
      write(dirA, '.env.local', `CLOUD=${PRODUCTION_CLOUD_NAME}`);
      write(dirB, '.env.staging', `X=${PRODUCTION_CLOUD_NAME}`);

      expect(findLeakingEnvFiles([dirA, dirB]).sort()).toEqual(
        [
          path.join(dirA, '.env'),
          path.join(dirA, '.env.local'),
          path.join(dirB, '.env.staging'),
        ].sort(),
      );
    });

    it('exempts .env.production files', () => {
      write(dirA, '.env.production', PRODUCTION_CLOUD_NAME);
      write(dirA, '.env.production.local', PRODUCTION_CLOUD_NAME);

      expect(findLeakingEnvFiles([dirA])).toEqual([]);
    });

    it('ignores env files that reference a different cloud', () => {
      write(dirA, '.env', 'CLOUD=my-dev-cloud');

      expect(findLeakingEnvFiles([dirA])).toEqual([]);
    });

    it('ignores files whose names are not env files', () => {
      write(dirA, 'notes.txt', PRODUCTION_CLOUD_NAME);
      write(dirA, '.envrc', PRODUCTION_CLOUD_NAME);
      write(dirA, '.env.example.bak', 'clean');

      expect(findLeakingEnvFiles([dirA])).toEqual([]);
    });

    it('skips directories that do not exist', () => {
      write(dirB, '.env', PRODUCTION_CLOUD_NAME);

      expect(findLeakingEnvFiles([path.join(root, 'missing'), dirB])).toEqual([
        path.join(dirB, '.env'),
      ]);
    });

    it('rethrows read errors other than ENOENT', () => {
      fsOverride.readdirSync = () => {
        throw Object.assign(new Error('denied'), { code: 'EACCES' });
      };

      expect(() => findLeakingEnvFiles([dirA])).toThrow('denied');
    });

    it('scans the default web and api app directories when none are given', () => {
      const scanned = [];
      fsOverride.readdirSync = (dir) => {
        scanned.push(dir);
        return [];
      };

      expect(findLeakingEnvFiles()).toEqual([]);
      expect(scanned.map((dir) => path.basename(dir))).toEqual(['web', 'api']);
    });
  });

  describe('run', () => {
    it('returns 0 and reports OK when nothing leaks', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      write(dirA, '.env', 'CLOUD=dev');

      expect(run([dirA])).toBe(0);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('OK'));
      expect(error).not.toHaveBeenCalled();
    });

    it('returns 1 and lists each leaking file', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      write(dirA, '.env', PRODUCTION_CLOUD_NAME);

      expect(run([dirA])).toBe(1);
      const output = error.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain(PRODUCTION_CLOUD_NAME);
      expect(output).toContain(path.join(dirA, '.env'));
      expect(output).toContain('GO-LIVE.md');
    });
  });

  describe('when executed as the entry script', () => {
    it('exits with the code returned by run', async () => {
      fsOverride.readdirSync = () => [];
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
      const originalArgv = process.argv;
      process.argv = [originalArgv[0], SCRIPT_PATH];
      try {
        vi.resetModules();
        await import('./check-cloudinary-env.mjs?entry');
      } finally {
        process.argv = originalArgv;
      }

      expect(exit).toHaveBeenCalledWith(0);
    });
  });
});
