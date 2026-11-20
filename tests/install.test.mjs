import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { SOURCE, SKILL_NAME, TARGETS, resolveRoot, payloadFiles, install, packageZip } from '../scripts/install.mjs';

function fixture(t) {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'embedded-style-test-'));
    t.after(() => {
        assert.equal(path.dirname(fs.realpathSync(base)), fs.realpathSync(os.tmpdir()));
        assert.ok(path.basename(base).startsWith('embedded-style-test-'));
        fs.rmSync(base, { recursive: true });
    });
    const source = path.join(base, 'source');
    fs.mkdirSync(path.join(source, 'references'), { recursive: true });
    fs.writeFileSync(path.join(source, 'SKILL.md'), `---\nname: ${SKILL_NAME}\ndescription: Test fixture.\n---\nBody.\n`);
    fs.writeFileSync(path.join(source, 'references/rules.md'), 'Retain the complete resource.\n');
    return { base, source, home: path.join(base, 'home') };
}

test('default paths distinguish the requested tools and shared directory', t => {
    const { home } = fixture(t);
    const expected = {
        claude: '.claude/skills', codex: '.agents/skills', 'codex-legacy': '.codex/skills',
        agy: '.gemini/config/skills', 'agy-legacy': '.gemini/antigravity/skills',
        deepseek: '.dsh/skills', shared: '.agents/skills', 'deepseek-shared': '.agents/skills',
    };
    for (const target of TARGETS) assert.equal(resolveRoot(target, { home, env: {} }), path.join(home, expected[target]));
    assert.equal(fs.existsSync(home), false);
});

test('configured roots honor whitespace, tilde and tool-specific variables', t => {
    const { home } = fixture(t);
    const env = { DSH_HOME: ' ~/harness ', DSH_AGENTS_HOME: '~/shared', CODEX_HOME: '~/old-codex', CLAUDE_CONFIG_DIR: '~/claude-config' };
    assert.equal(resolveRoot('deepseek', { home, env }), path.join(home, 'harness/skills'));
    assert.equal(resolveRoot('deepseek-shared', { home, env }), path.join(home, 'shared/skills'));
    assert.equal(resolveRoot('codex-legacy', { home, env }), path.join(home, 'old-codex/skills'));
    assert.equal(resolveRoot('codex', { home, env }), path.join(home, '.agents/skills'));
    assert.equal(resolveRoot('claude', { home, env }), path.join(home, 'claude-config/skills'));
    assert.equal(resolveRoot('deepseek', { home, env: { DSH_HOME: '  ' } }), path.join(home, '.dsh/skills'));
});

test('project scope uses an explicit existing directory and ignores user overrides', t => {
    const { base, home } = fixture(t);
    const project = path.join(base, '工程 with spaces');
    fs.mkdirSync(project);
    assert.equal(resolveRoot('deepseek', { scope: 'project', project, home, env: { DSH_HOME: '~/other' } }), path.join(project, '.dsh/skills'));
    assert.equal(resolveRoot('agy', { scope: 'project', project, home }), path.join(project, '.agents/skills'));
    assert.throws(() => resolveRoot('codex', { scope: 'project', home }));
    assert.throws(() => resolveRoot('agy-legacy', { scope: 'project', project, home }));
    assert.throws(() => resolveRoot('unknown', { home }));
});

test('preview has no filesystem side effects; install preserves resource contents', t => {
    const { source, home } = fixture(t);
    const destination = path.join(home, '.agents/skills', SKILL_NAME);
    assert.equal(install(source, destination).applied, false);
    assert.equal(fs.existsSync(home), false);
    assert.equal(install(source, destination, { apply: true }).applied, true);
    for (const name of payloadFiles(source)) assert.deepEqual(fs.readFileSync(path.join(destination, name)), fs.readFileSync(path.join(source, name)));
    assert.throws(() => install(source, destination, { apply: true }), /exists/);
});

test('update stages a complete copy, removes stale deployed files and retains a backup outside the scan root', t => {
    const { source, home } = fixture(t);
    const destination = path.join(home, '.agents/skills', SKILL_NAME);
    install(source, destination, { apply: true });
    fs.writeFileSync(path.join(destination, 'old-only.md'), 'old');
    fs.writeFileSync(path.join(source, 'references/rules.md'), 'new');
    const result = install(source, destination, { apply: true, update: true });
    assert.equal(fs.readFileSync(path.join(destination, 'references/rules.md'), 'utf8'), 'new');
    assert.equal(fs.existsSync(path.join(destination, 'old-only.md')), false);
    assert.equal(fs.readFileSync(path.join(result.backup, 'old-only.md'), 'utf8'), 'old');
    assert.equal(path.relative(path.join(home, '.agents/skills'), result.backup).startsWith('..'), true);
    assert.equal(fs.readdirSync(path.join(home, '.agents')).some(name => name.startsWith('.personal-style-stage-')), false);
});

test('failed replacement restores the previous installation', t => {
    const { source, home } = fixture(t);
    const destination = path.join(home, '.agents/skills', SKILL_NAME);
    install(source, destination, { apply: true });
    fs.writeFileSync(path.join(source, 'references/rules.md'), 'replacement');
    const rename = fs.renameSync;
    fs.renameSync = (from, to) => {
        if (from.includes('.personal-style-stage-') && to === destination) throw new Error('simulated replacement failure');
        return rename(from, to);
    };
    try { assert.throws(() => install(source, destination, { apply: true, update: true }), /simulated/); }
    finally { fs.renameSync = rename; }
    assert.equal(fs.readFileSync(path.join(destination, 'references/rules.md'), 'utf8'), 'Retain the complete resource.\n');
});

test('source overlap and manager stores are rejected without changing either', t => {
    const { source, home } = fixture(t);
    assert.throws(() => install(source, path.join(source, 'inside', SKILL_NAME)), /contain/);
    assert.throws(() => install(source, path.dirname(source)), /contain/);
    assert.throws(() => install(source, path.join(home, '.cc-switch/skills', SKILL_NAME), { apply: true }), /CC Switch/);
    assert.equal(fs.existsSync(home), false);
});

test('directory links and junctions are neither overwritten nor bundled', t => {
    const { base, source } = fixture(t);
    const linked = path.join(base, 'linked');
    fs.symlinkSync(source, linked, process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => install(source, linked, { apply: true, update: true }), /link\/junction/);
    fs.symlinkSync(source, path.join(source, 'references/linked'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => payloadFiles(source), /links\/junctions/);
});

test('another skill cannot be overwritten even with update', t => {
    const { source, home } = fixture(t);
    const destination = path.join(home, 'skills', SKILL_NAME);
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(path.join(destination, 'SKILL.md'), '---\nname: other-skill\ndescription: Other.\n---\n');
    assert.throws(() => install(source, destination, { apply: true, update: true }), /not this skill/);
    assert.match(fs.readFileSync(path.join(destination, 'SKILL.md'), 'utf8'), /other-skill/);
});

test('ZIP uses one bundle root and excludes non-distribution files', t => {
    const { base, source } = fixture(t);
    for (const name of ['.git/config', 'tests/test.mjs', 'dist/old.zip', 'scripts/__pycache__/old.pyc']) {
        fs.mkdirSync(path.dirname(path.join(source, name)), { recursive: true });
        fs.writeFileSync(path.join(source, name), 'excluded');
    }
    fs.writeFileSync(path.join(source, 'references/中文规则.md'), 'UTF-8 resource');
    const archive = path.join(base, 'skill.zip');
    const result = packageZip(source, archive);
    const data = fs.readFileSync(archive);
    const end = data.length - 22;
    assert.equal(data.readUInt32LE(end), 0x06054b50);
    assert.equal(data.readUInt16LE(end + 10), result.files);
    let cursor = data.readUInt32LE(end + 16);
    const entries = [];
    for (let index = 0; index < result.files; index++) {
        assert.equal(data.readUInt32LE(cursor), 0x02014b50);
        const length = data.readUInt16LE(cursor + 28);
        entries.push(data.subarray(cursor + 46, cursor + 46 + length).toString('utf8'));
        cursor += 46 + length + data.readUInt16LE(cursor + 30) + data.readUInt16LE(cursor + 32);
    }
    assert.ok(entries.includes(`${SKILL_NAME}/SKILL.md`));
    assert.ok(entries.includes(`${SKILL_NAME}/references/中文规则.md`));
    assert.ok(entries.every(name => name.startsWith(`${SKILL_NAME}/`) && !/(\.git|tests|dist|__pycache__)/.test(name)));
    assert.throws(() => packageZip(source, archive), /exists/);
    assert.throws(() => packageZip(source, path.join(source, 'references/invalid.zip')), /outside/);
});

test('CLI works from another working directory and a custom path with spaces', t => {
    const { base } = fixture(t);
    const root = path.join(base, '自定义 skills');
    const cli = path.join(SOURCE, 'scripts/install.mjs');
    const result = JSON.parse(execFileSync(process.execPath, [cli, 'install', '--skills-dir', root], { cwd: base, encoding: 'utf8' }));
    assert.equal(result.destination, path.join(root, SKILL_NAME));
    assert.equal(result.applied, false);
    assert.equal(fs.existsSync(root), false);
});

test('distribution payload includes every runtime reference and the npm entry', () => {
    const files = payloadFiles(SOURCE).map(name => name.split(path.sep).join('/'));
    assert.ok(files.includes('scripts/install.mjs'));
    assert.ok(files.includes('package.json'));
    assert.ok(files.includes('LICENSE'));
    for (const link of fs.readFileSync(path.join(SOURCE, 'SKILL.md'), 'utf8').matchAll(/\]\((references\/[^)]+)\)/g)) {
        assert.ok(files.includes(link[1]), `Missing skill resource: ${link[1]}`);
    }
    const metadata = JSON.parse(fs.readFileSync(path.join(SOURCE, 'package.json'), 'utf8'));
    assert.equal(metadata.bin[SKILL_NAME], 'scripts/install.mjs');
    assert.equal(metadata.license, 'MIT');
    assert.equal(Object.keys(metadata.scripts).some(name => /^(preinstall|install|postinstall|prepare)$/.test(name)), false);
});

test('CLI rejects ambiguous scope instead of writing to the user directory', t => {
    const { base } = fixture(t);
    const cli = path.join(SOURCE, 'scripts/install.mjs');
    assert.throws(() => execFileSync(process.execPath, [cli, 'install', '--target', 'codex', '--project', base, '--apply'], {
        cwd: base, encoding: 'utf8', stdio: 'pipe',
    }), error => /--project requires --scope project/.test(error.stderr));
    assert.equal(execFileSync(process.execPath, [cli, '--version'], { cwd: base, encoding: 'utf8' }).trim(), '0.1.0');
});
