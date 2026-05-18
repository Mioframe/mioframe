#!/usr/bin/env python3
"""Import the local Material 3 markdown documentation archive into the UI docs tree.

Usage:
    python3 scripts/import-material3-docs.py material3-markdown-docs.zip
    python3 scripts/import-material3-docs.py material3-markdown-docs.zip src/shared/ui/material3

The importer intentionally preserves copied markdown source pages. Project-specific notes should live in
AGENTS.md, README.md, PR notes, or implementation docs, not inside copied Material source pages.
"""

from __future__ import annotations

import argparse
import shutil
import zipfile
from pathlib import Path

DEFAULT_OUTPUT_DIR = Path("src/shared/ui/material3")
COPY_SUFFIXES = {".md", ".json", ".csv"}
NORMALIZED_TOP_LEVEL_DOCS = (
    "foundations",
    "styles",
    "develop",
    "libraries",
    "google-material-3",
    "m3",
)


def title_from_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-"))


def safe_members(archive: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    members: list[zipfile.ZipInfo] = []
    for info in archive.infolist():
        path = Path(info.filename)
        if info.is_dir() or path.is_absolute() or ".." in path.parts:
            continue
        if path.suffix in COPY_SUFFIXES:
            members.append(info)
    return members


def read_text(archive: zipfile.ZipFile, name: str) -> str:
    return archive.read(name).decode("utf-8")


def write_archive_member(archive: zipfile.ZipFile, name: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(archive.read(name))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def import_docs(archive_path: Path, output_dir: Path) -> None:
    if not archive_path.exists():
        raise FileNotFoundError(f"Archive not found: {archive_path}")

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True)

    with zipfile.ZipFile(archive_path) as archive:
        members = safe_members(archive)
        names = sorted(info.filename for info in members)
        name_set = set(names)

        source_dir = output_dir / "source"
        for name in names:
            write_archive_member(archive, name, source_dir / name)

        component_files = [
            name for name in names if name.startswith("components/") and name.endswith(".md")
        ]
        component_slugs = sorted(
            {
                Path(name).parts[1]
                for name in component_files
                if len(Path(name).parts) >= 2
            }
        )

        component_rows: list[tuple[str, str, int]] = []
        for slug in component_slugs:
            component_dir = output_dir / "components" / slug
            component_dir.mkdir(parents=True)
            copied_pages: list[str] = []

            landing = f"components/{slug}.md"
            if landing in name_set:
                write_archive_member(archive, landing, component_dir / "index.md")
                copied_pages.append("index.md")

            for name in sorted(
                file_name
                for file_name in component_files
                if file_name.startswith(f"components/{slug}/")
            ):
                target_relative = Path(*Path(name).parts[2:])
                write_archive_member(archive, name, component_dir / target_relative)
                copied_pages.append(target_relative.as_posix())

            title = title_from_slug(slug)
            component_rows.append((slug, title, len(copied_pages)))
            readme = "\n".join(
                [
                    f"# {title}",
                    "",
                    f"Canonical Material 3 documentation copied from `source/components/{slug}`.",
                    "",
                    "## Pages",
                    "",
                    *(f"- [{page}](./{page})" for page in copied_pages),
                    "",
                    "## Implementation status",
                    "",
                    "- Status: intentionally not inferred by this generated documentation bundle.",
                    "- When implementing or refactoring the component, compare the project primitive with every page in this folder: overview, specs, guidelines, accessibility, and any extra pages present for this component.",
                    "",
                ]
            )
            write_text(component_dir / "README.md", readme)

        for top_level in NORMALIZED_TOP_LEVEL_DOCS:
            for name in names:
                if not name.startswith(f"{top_level}/") or not name.endswith(".md"):
                    continue
                write_archive_member(archive, name, output_dir / name)

    write_text(
        output_dir / "README.md",
        "\n".join(
            [
                "# Material 3 documentation",
                "",
                "This directory is the project-local source of truth for Material Design 3 UI work.",
                "",
                "The files are generated from the provided `material3-markdown-docs.zip` archive and preserve the original markdown content. Do not replace these rules with summaries when reviewing or implementing components.",
                "",
                "## How to use",
                "",
                "- Use `components/<component>/` when implementing or reviewing a specific Material component.",
                "- Use `styles/` for color, typography, elevation, icons, motion, and shape rules.",
                "- Use `foundations/` for accessibility, adaptive design, layout, content design, tokens, interaction states, and usability.",
                "- Use `source/` when an exact original path from the imported archive is needed.",
                "",
                "## Component implementation rule",
                "",
                "Every shared Material-style primitive should have a direct documentation reference to the matching folder in `components/`. If a Material component is not implemented yet, its folder still stays here so future work has a canonical target.",
                "",
                "## Update rule",
                "",
                "When the upstream Material 3 markdown export is refreshed, regenerate this directory from the new archive and review diffs instead of manually editing copied source pages.",
                "",
            ]
        ),
    )

    write_text(
        output_dir / "COMPONENTS.md",
        "\n".join(
            [
                "# Material 3 component index",
                "",
                "| Component | Documentation | Pages |",
                "| --- | --- | --- |",
                *(
                    f"| {title} | [components/{slug}/](./components/{slug}/README.md) | {count} |"
                    for slug, title, count in component_rows
                ),
                "",
            ]
        ),
    )

    write_text(
        output_dir / "AGENTS.md",
        "\n".join(
            [
                "# src/shared/ui/material3",
                "",
                "Inherits the rules from `src/shared/ui/AGENTS.md`. Applies to the local Material 3 documentation source of truth.",
                "",
                "## Contains",
                "",
                "- Exact markdown documentation imported from the provided Material 3 documentation archive.",
                "- Component documentation folders for all Material 3 components present in the archive, including components not yet implemented in the project UI library.",
                "- Foundation and style documentation used to verify tokens, typography, layout, accessibility, adaptive behavior, motion, shape, elevation, and interaction states.",
                "",
                "## Patterns",
                "",
                "- Treat these files as reference documentation, not as app content.",
                "- When implementing or refactoring a shared `MD*` primitive, read the matching `components/<component>/` folder before changing API, DOM, tokens, states, accessibility, or layout.",
                "- Prefer links from implementation docs or PR notes to these local files instead of relying on memory or approximate Material rules.",
                "- Preserve original imported markdown content unless regenerating from a newer Material 3 export.",
                "",
                "## Anti-patterns",
                "",
                "- Do not summarize over these files and delete the original rules.",
                "- Do not use these docs as runtime user-facing help content.",
                "- Do not manually patch copied Material source pages for project preferences; document project-specific divergence outside copied source pages.",
                "",
                "## Constraints",
                "",
                "- If a copied source page appears wrong because of import/conversion quality, fix the importer or regenerate from a better source rather than silently editing one page.",
                "",
            ]
        ),
    )

    print(
        f"Imported {len(names)} source files and {len(component_rows)} component folders into {output_dir}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("output_dir", type=Path, nargs="?", default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()
    import_docs(args.archive, args.output_dir)


if __name__ == "__main__":
    main()
