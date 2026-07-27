import fs from 'node:fs';

const invocationPath = 'scripts/lib/verifyInvocation.mjs';
let invocationSource = fs.readFileSync(invocationPath, 'utf8');

invocationSource = invocationSource.replace(
  'export function quoteShellArg(value) {',
  'function quoteShellArg(value) {',
);

const formatterSignature = 'export function formatShellCommand(command, args = []) {';
const documentedFormatter = `/**
 * Format a command and its arguments as one shell-safe display string.
 * @param command Executable or command name.
 * @param [args] Command arguments.
 * @returns Shell-safe command text for logs and retry instructions.
 */
${formatterSignature}`;

if (!invocationSource.includes(documentedFormatter)) {
  if (!invocationSource.includes(formatterSignature)) {
    throw new Error('[autofix-lint] missing formatShellCommand export');
  }

  invocationSource = invocationSource.replace(formatterSignature, documentedFormatter);
}

fs.writeFileSync(invocationPath, invocationSource, 'utf8');

const settingsPath = 'src/widgets/SettingsSections/SettingsSections.test.ts';
let settingsSource = fs.readFileSync(settingsPath, 'utf8');
const sectionStart = settingsSource.indexOf("vi.mock('@shared/ui/Switch'");
const sectionEnd = settingsSource.indexOf('\nconst mountSettingsSections', sectionStart);

if (sectionStart === -1 || sectionEnd === -1) {
  throw new Error('[autofix-lint] unable to locate MDSwitch stub');
}

const section = settingsSource
  .slice(sectionStart, sectionEnd)
  .replace("    emits: ['update:selected'],\n", '');
settingsSource = settingsSource.slice(0, sectionStart) + section + settingsSource.slice(sectionEnd);
fs.writeFileSync(settingsPath, settingsSource, 'utf8');

console.log('[autofix-lint] fixed formatter documentation and MDSwitch stub contract');
