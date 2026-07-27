import fs from 'node:fs';

function updateFile(filePath, transform) {
  const source = fs.readFileSync(filePath, 'utf8');
  const next = transform(source);

  if (next !== source) {
    fs.writeFileSync(filePath, next, 'utf8');
    console.log(`[full-unit-warning-fix] updated ${filePath}`);
  } else {
    console.log(`[full-unit-warning-fix] ${filePath} already clean`);
  }
}

function transformTestBlock(source, title, transform) {
  const marker = `  it('${title}'`;
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error(`[full-unit-warning-fix] missing test: ${title}`);
  }

  const nextTest = source.indexOf('\n  it(', start + marker.length);
  const nextDescribe = source.indexOf('\n  describe(', start + marker.length);
  const candidates = [nextTest, nextDescribe].filter((index) => index !== -1);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;
  const block = source.slice(start, end);
  const nextBlock = transform(block);

  return source.slice(0, start) + nextBlock + source.slice(end);
}

function addAccessibleNames(source, excludedTestTitle = null) {
  const addNames = (text) =>
    text.replace(
      /<MDList\b([^>]*\b:?selection-mode\s*=\s*(?:"[^"]*"|'[^']*')[^>]*)>/g,
      (match, attributes) => {
        if (/\baria-(?:label|labelledby)\s*=/.test(attributes)) {
          return match;
        }

        return `<MDList aria-label="Options"${attributes}>`;
      },
    );

  if (excludedTestTitle === null) {
    return addNames(source);
  }

  const marker = `  it('${excludedTestTitle}'`;
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error(`[full-unit-warning-fix] missing excluded test: ${excludedTestTitle}`);
  }

  const end = source.indexOf('\n  it(', start + marker.length);

  if (end === -1) {
    throw new Error(`[full-unit-warning-fix] unable to bound excluded test: ${excludedTestTitle}`);
  }

  return addNames(source.slice(0, start)) + source.slice(start, end) + addNames(source.slice(end));
}

function suppressExpectedWarning(block) {
  let next = block;
  const openingEnd = next.indexOf('=> {') + '=> {'.length;

  if (openingEnd < '=> {'.length) {
    throw new Error('[full-unit-warning-fix] unable to locate test callback opening');
  }

  if (!next.includes("vi.spyOn(console, 'warn')")) {
    next =
      next.slice(0, openingEnd) +
      "\n    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});" +
      next.slice(openingEnd);
  }

  if (!next.includes('warnSpy.mockRestore();')) {
    const cleanupIndex = next.lastIndexOf("    document.body.innerHTML = '';");
    const closingIndex = next.lastIndexOf('\n  });');
    const insertIndex = cleanupIndex !== -1 ? cleanupIndex : closingIndex;

    if (insertIndex === -1) {
      throw new Error('[full-unit-warning-fix] unable to locate test cleanup');
    }

    next = next.slice(0, insertIndex) + '    warnSpy.mockRestore();\n' + next.slice(insertIndex);
  }

  return next;
}

updateFile('src/shared/ui/Lists/MDList.test.ts', (source) => {
  let next = addAccessibleNames(
    source,
    'warns in development when a selection listbox is missing an accessible name',
  );

  next = transformTestBlock(
    next,
    'keeps keyboard listeners attached across a tag="ul" + selectionMode round trip that swaps the root element',
    suppressExpectedWarning,
  );
  next = transformTestBlock(
    next,
    'does not duplicate keyboard handling after repeated tag/selectionMode root-element swaps',
    suppressExpectedWarning,
  );

  return next;
});

updateFile('src/shared/ui/Lists/MDListSelectionItem.test.ts', (source) => {
  let next = source;
  const beforeSetup = `        itemProps: { labelText: 'Option', value: 'opt', ...props },
        listProps,`;
  const afterSetup = `        itemProps: { labelText: 'Option', value: 'opt', ...props },
        listProps: { 'aria-label': 'Options', ...listProps },`;

  if (next.includes(beforeSetup)) {
    next = next.replace(beforeSetup, afterSetup);
  } else if (!next.includes(afterSetup)) {
    throw new Error('[full-unit-warning-fix] unexpected mountSelectionItem setup');
  }

  next = addAccessibleNames(next);
  next = transformTestBlock(
    next,
    'uses div root tag even when the parent list tag is ul (selection lists force div)',
    suppressExpectedWarning,
  );

  return next;
});

updateFile('src/widgets/SettingsSections/SettingsSections.test.ts', (source) => {
  const sectionStart = source.indexOf("vi.mock('@shared/ui/Switch'");
  const sectionEnd = source.indexOf('\nconst mountSettingsSections', sectionStart);

  if (sectionStart === -1 || sectionEnd === -1) {
    throw new Error('[full-unit-warning-fix] unable to locate MDSwitch stub');
  }

  let section = source.slice(sectionStart, sectionEnd);
  const beforeProp = `      modelValue: {
        type: Boolean,
        required: true,
      },`;
  const afterProp = `      selected: {
        type: Boolean,
        default: false,
      },`;

  if (section.includes(beforeProp)) {
    section = section.replace(beforeProp, afterProp);
  } else if (!section.includes(afterProp)) {
    throw new Error('[full-unit-warning-fix] unexpected MDSwitch prop contract');
  }

  section = section.replace("    emits: ['update:modelValue'],", "    emits: ['update:selected'],");
  section = section.replaceAll('props.modelValue', 'props.selected');

  return source.slice(0, sectionStart) + section + source.slice(sectionEnd);
});
