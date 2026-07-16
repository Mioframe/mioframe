// Small, AST-native ESLint rule for `import()` boundary enforcement.
//
// `no-restricted-syntax` cannot be reused for this because flat-config
// blocks that set the same rule ID for overlapping files replace, rather
// than merge, its value: a later block silently disables an earlier one's
// restrictions. This rule owns a dedicated rule ID (`local/no-restricted-
// dynamic-imports`) so Material's dynamic-import boundaries coexist with the
// unrelated `no-restricted-syntax` DOM-communication restrictions configured
// for the same Vue files.
//
// It only visits `ImportExpression` and only inspects statically known
// string literal specifiers; it does not resolve paths or inspect static
// imports.

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict dynamic import() specifiers matching configured regexes.',
    },
    schema: [
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            regex: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['regex', 'message'],
          additionalProperties: false,
        },
      },
    ],
    messages: {
      restricted: '{{message}}',
    },
  },
  create(context) {
    const restrictions = (context.options[0] ?? []).map(({ regex, message }) => ({
      pattern: new RegExp(regex),
      message,
    }));

    return {
      ImportExpression(node) {
        if (node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
          return;
        }

        for (const { pattern, message } of restrictions) {
          if (pattern.test(node.source.value)) {
            context.report({ node, messageId: 'restricted', data: { message } });
          }
        }
      },
    };
  },
};

export const localRulesPlugin = {
  rules: {
    'no-restricted-dynamic-imports': rule,
  },
};
