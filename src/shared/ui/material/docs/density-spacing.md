# Material 3 density and spacing

## Principle

Shared Material components must not invent local spacing or density systems when official guidance defines measurements, target areas, or compact behavior.

## Units

Use the authoring units shown by official Material documentation. Translation into browser-supported values belongs to the centralized PostCSS pipeline described in [Units](./units.md).

## Measurement sources

Use measurements in this order:

1. exact component specification;
2. official layout, density, and adaptive guidance;
3. project spacing helpers such as `step` only for product composition where no exact Material measurement applies;
4. an explicit deviation when a required scenario cannot follow either rule.

## Density

Density changes are deliberate supported configurations, not arbitrary shrinking.

Do not reduce visible geometry or target areas merely to fit more content. Verify that the official component or layout guidance supports the compact configuration.

## Target areas

Interactive components own their target-area contract. Consumers must not be required to add undocumented padding around an undersized control.

When visual and interactive bounds differ:

- keep their owners explicit;
- document the distinction;
- verify the interactive geometry in a browser;
- prevent clipping by surrounding layout.

## Application spacing

Use `--app-*` for application-specific spacing outside Material token vocabulary. Do not encode product layout measurements as invented `--md-*` tokens.

## Verification

For changed density, spacing, or target-area behavior, verify:

- the current official measurement source;
- rendered visual geometry;
- interactive bounds;
- compact, medium, expanded, or container-specific behavior when applicable;
- representative surrounding layout and clipping risk.
