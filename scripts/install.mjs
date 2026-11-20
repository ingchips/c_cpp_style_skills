#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';

export const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SKILL_NAME = 'personal-embedded-coding-style';
export const PAYLOAD = ['SKILL.md', 'README.md', 'LICENSE', 'package.json', 'references', 'templates', 'docs', 'scripts'];
export const TARGETS = ['claude', 'codex', 'codex-legacy', 'agy', 'agy-legacy', 'deepseek', 'shared', 'deepseek-shared'];
const PROJECT_ROOTS = {
    claude: '.claude/skills', codex: '.agents/skills', agy: '.agents/skills',
    deepseek: '.dsh/skills', shared: '.agents/skills', 'deepseek-shared': '.agents/skills',
};

function userPath(value, home) {
    if (value === '~') return home;
    return /^~[/\\]/.test(value) ? path.join(home, value.slice(2)) : value;
}

export function resolveRoot(target, { scope = 'user', home = os.homedir(), project, env = process.env } = {}) {
    home = path.resolve(home);
    if (!TARGETS.includes(target)) throw new Error(`Unknown target: ${target}`);
    if (scope === 'project') {
        if (!PROJECT_ROOTS[target]) throw new Error('This compatibility target has no project default; use --skills-dir.');
        if (!project || !fs.statSync(project).isDirectory()) throw new Error('Project scope requires an existing --project directory.');
        return path.resolve(project, PROJECT_ROOTS[target]);
    }
    if (scope !== 'user') throw new Error('Scope must be user or project.');
    const configured = (key, fallback) => userPath(env[key]?.trim() || path.join(home, fallback), home);
    const roots = {
        claude: path.join(configured('CLAUDE_CONFIG_DIR', '.claude'), 'skills'),
        codex: path.join(home, '.agents/skills'),
        'codex-legacy': path.join(configured('CODEX_HOME', '.codex'), 'skills'),
        agy: path.join(home, '.gemini/config/skills'),
        'agy-legacy': path.join(home, '.gemini/antigravity/skills'),
        deepseek: path.join(configured('DSH_HOME', '.dsh'), 'skills'),
        shared: path.join(home, '.agents/skills'),
        'deepseek-shared': path.join(configured('DSH_AGENTS_HOME', '.agents'), 'skills'),
    };
    return path.resolve(roots[target]);
}

function lstat(file) {
    try { return fs.lstatSync(file); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function canonical(file) {
    let current = path.resolve(file);
    const missing = [];
    while (!lstat(current)) {
        missing.unshift(path.basename(current));
        current = path.dirname(current);
    }
    return path.join(fs.realpathSync(current), ...missing);
}

function within(parent, child) {
    const relative = path.relative(parent, child);
    return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function hasSkillName(file) {
    const text = fs.readFileSync(file, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    return !!frontmatter && /^name:\s*["']?personal-embedded-coding-style["']?\s*$/m.test(frontmatter[1]);
}

export function payloadFiles(source) {
    source = fs.realpathSync(source);
    if (!hasSkillName(path.join(source, 'SKILL.md'))) throw new Error('Source is not the expected skill package.');
    const files = [];
    function walk(relative) {
        if (relative.split(path.sep).includes('__pycache__')) return;
        const info = lstat(path.join(source, relative));
        if (!info) return;
        if (info.isSymbolicLink()) throw new Error(`Source links/junctions are not copied: ${relative}`);
        if (info.isDirectory()) {
            for (const name of fs.readdirSync(path.join(source, relative))) walk(path.join(relative, name));
        } else if (info.isFile() && !/\.py[co]$/.test(relative)) {
            files.push(relative);
        }
    }
    PAYLOAD.forEach(walk);
    return files.sort();
}

export function install(source, destination, { apply = false, update = false } = {}) {
    source = fs.realpathSync(source);
    destination = path.resolve(destination);
    if (lstat(destination)?.isSymbolicLink()) throw new Error('Destination is a link/junction; update through its manager or source checkout.');
    const resolved = canonical(destination);
    if (within(source, resolved) || within(resolved, source)) throw new Error('Source and destination must not contain one another.');
    if (resolved.split(path.sep).some(part => part.toLowerCase() === '.cc-switch')) {
        throw new Error('Use CC Switch ZIP/repository import instead of writing its managed store.');
    }
    const existing = lstat(destination);
    if (existing) {
        if (!existing.isDirectory() || !hasSkillName(path.join(destination, 'SKILL.md'))) throw new Error('Existing destination is not this skill.');
        if (!update) throw new Error('Destination exists; preview with --update before applying an update.');
    }
    const files = payloadFiles(source);
    const result = { action: existing ? 'update' : 'install', source, destination, files: files.length, applied: false };
    if (!apply) return result;

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const stageParent = fs.realpathSync(path.resolve(destination, '../..'));
    const stage = fs.mkdtempSync(path.join(stageParent, '.personal-style-stage-'));
    let backup;
    try {
        const stagedSkill = path.join(stage, SKILL_NAME);
        fs.mkdirSync(stagedSkill);
        for (const relative of files) {
            const output = path.join(stagedSkill, relative);
            fs.mkdirSync(path.dirname(output), { recursive: true });
            fs.copyFileSync(path.join(source, relative), output, fs.constants.COPYFILE_EXCL);
        }
        if (lstat(destination)?.isSymbolicLink()) throw new Error('Destination became a link/junction; installation stopped.');
        if (lstat(destination)) {
            if (!update || !hasSkillName(path.join(destination, 'SKILL.md'))) throw new Error('Destination changed during installation.');
            const backupRoot = path.join(stageParent, 'skill-install-backups', SKILL_NAME);
            fs.mkdirSync(backupRoot, { recursive: true });
            if (!within(stageParent, canonical(backupRoot))) throw new Error('Backup root resolves outside the installation parent.');
            backup = path.join(backupRoot, `${Date.now()}-${randomUUID()}`);
            fs.renameSync(destination, backup);
        }
        try { fs.renameSync(stagedSkill, destination); }
        catch (error) {
            if (backup && !lstat(destination)) fs.renameSync(backup, destination);
            throw error;
        }
        result.applied = true;
        if (backup) result.backup = backup;
        return result;
    } finally {
        if (path.dirname(canonical(stage)) !== stageParent || !path.basename(stage).startsWith('.personal-style-stage-')) {
            throw new Error('Unexpected staging path; refusing recursive cleanup.');
        }
        fs.rmSync(stage, { recursive: true });
    }
}

function crc32(data) {
    let crc = 0xffffffff;
    for (const byte of data) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

export function packageZip(source, output) {
    source = fs.realpathSync(source);
    output = path.resolve(output);
    if (lstat(output)) throw new Error('Archive exists; choose another --output path.');
    if (path.extname(output).toLowerCase() !== '.zip') throw new Error('Archive output must end in .zip.');
    if (PAYLOAD.some(name => within(canonical(path.join(source, name)), canonical(output)))) {
        throw new Error('Archive must be outside exported package files/directories.');
    }
    const files = payloadFiles(source);
    if (files.length > 65535) throw new Error('Package exceeds the small ZIP format limit.');
    const local = [], central = [];
    let offset = 0;
    for (const relative of files) {
        const name = Buffer.from(`${SKILL_NAME}/${relative.split(path.sep).join('/')}`);
        const data = fs.readFileSync(path.join(source, relative));
        const crc = crc32(data);
        // Stored UTF-8 ZIP entries avoid a dependency or an external archiver.
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0);
        header.writeUInt16LE(20, 4);
        header.writeUInt16LE(0x0800, 6);
        header.writeUInt16LE(0x0021, 12);
        header.writeUInt32LE(crc, 14);
        header.writeUInt32LE(data.length, 18);
        header.writeUInt32LE(data.length, 22);
        header.writeUInt16LE(name.length, 26);
        const directory = Buffer.alloc(46);
        directory.writeUInt32LE(0x02014b50, 0);
        directory.writeUInt16LE(20, 4);
        directory.writeUInt16LE(20, 6);
        directory.writeUInt16LE(0x0800, 8);
        directory.writeUInt16LE(0x0021, 14);
        directory.writeUInt32LE(crc, 16);
        directory.writeUInt32LE(data.length, 20);
        directory.writeUInt32LE(data.length, 24);
        directory.writeUInt16LE(name.length, 28);
        directory.writeUInt32LE(offset, 42);
        local.push(header, name, data);
        central.push(directory, name);
        offset += header.length + name.length + data.length;
    }
    const directory = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, Buffer.concat([...local, directory, end]), { flag: 'wx' });
    return { archive: output, files: files.length };
}

const HELP = `Usage:
  personal-embedded-coding-style paths [--home-dir DIR] [--project DIR]
  personal-embedded-coding-style install --target TARGET [--scope user|project] [--project DIR] [--apply] [--update]
  personal-embedded-coding-style install --skills-dir ROOT [--apply] [--update]
  personal-embedded-coding-style package --output FILE.zip
  personal-embedded-coding-style --version
Targets: ${TARGETS.join(', ')}
Install defaults to preview. CC Switch uses ZIP/repository import, not direct store writes.
`;

export function main(args = process.argv.slice(2)) {
    try {
        const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
            target: { type: 'string' }, scope: { type: 'string', default: 'user' },
            project: { type: 'string' }, 'skills-dir': { type: 'string' },
            'home-dir': { type: 'string', default: os.homedir() }, output: { type: 'string' },
            apply: { type: 'boolean' }, update: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
            version: { type: 'boolean' },
        } });
        if (values.version) {
            console.log(JSON.parse(fs.readFileSync(path.join(SOURCE, 'package.json'), 'utf8')).version);
            return 0;
        }
        if (values.help || positionals.length === 0) { console.log(HELP); return 0; }
        if (positionals.length !== 1) throw new Error('Specify one command.');
        const home = path.resolve(values['home-dir']);
        let result;
        if (positionals[0] === 'paths') {
            result = Object.fromEntries(TARGETS.map(target => [target, { user: resolveRoot(target, { home }) }]));
            if (values.project) {
                for (const target of Object.keys(PROJECT_ROOTS)) result[target].project = resolveRoot(target, { home, scope: 'project', project: values.project });
            }
            result.ccswitch = { managedOnly: true, defaultStore: path.join(home, '.cc-switch/skills'), alternativeStore: path.join(home, '.agents/skills'), note: 'Actual store/overrides are configured in CC Switch; import through its UI.' };
        } else if (positionals[0] === 'install') {
            if (!!values.target === !!values['skills-dir']) throw new Error('Choose exactly one of --target or --skills-dir.');
            if (values.project && values.scope !== 'project') throw new Error('--project requires --scope project for installation.');
            if (values['skills-dir'] && (values.scope !== 'user' || values.project)) throw new Error('--skills-dir is explicit; do not combine it with project scope.');
            const root = values['skills-dir'] ? path.resolve(userPath(values['skills-dir'], home)) : resolveRoot(values.target, { home, scope: values.scope, project: values.project });
            result = install(SOURCE, path.join(root, SKILL_NAME), { apply: values.apply, update: values.update });
        } else if (positionals[0] === 'package') {
            if (!values.output) throw new Error('Specify --output FILE.zip.');
            result = packageZip(SOURCE, values.output);
        } else throw new Error(`Unknown command: ${positionals[0]}`);
        console.log(JSON.stringify(result, null, 2));
        return 0;
    } catch (error) {
        console.error(`error: ${error.message}`);
        return 1;
    }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
