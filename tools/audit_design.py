#!/usr/bin/env python3
"""Small, dependency-free audit for the post-migration design tree."""

from __future__ import annotations

import argparse
import ast
import re
import sys
from collections import defaultdict
from pathlib import Path


REFERENCE_KEYS = {
    "references",
    "inherits",
    "owner",
    "global_contract",
    "faction_assets",
}
LINK = re.compile(r"!?\[[^]]*\]\(([^)]+)\)")
PRINCIPLE_DOCS = {
    Path("design/README.md"),
    Path("design/schema/README.md"),
    Path("design/armors.md"), Path("design/collisions.md"),
    Path("design/damages.md"), Path("design/locomotors.md"),
    Path("design/sensing.md"), Path("design/skills.md"),
    Path("design/status-effects.md"), Path("design/targetabilities.md"),
    Path("design/weapons.md"),
}


def scalar(value: str):
    value = value.strip()
    if not value:
        return ""
    if value in ("[]", "{}"):
        return []
    if value.startswith("[") and value.endswith("]"):
        body = value[1:-1].strip()
        return [] if not body else [unquote(x.strip()) for x in body.split(",")]
    return unquote(value)


def unquote(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
        try:
            return str(ast.literal_eval(value))
        except (SyntaxError, ValueError):
            return value[1:-1]
    return value


def front_matter(path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, lines, []
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, lines, [f"{path}: unterminated YAML front matter"]

    data = {}
    errors = []
    current = None
    for number, line in enumerate(lines[1:end], 2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = re.match(r"^([A-Za-z_][\w-]*):(?:\s*(.*))?$", line)
        if match:
            key, value = match.group(1), match.group(2) or ""
            if key in data:
                errors.append(f"{path}:{number}: duplicate front-matter key {key}")
            data[key] = scalar(value)
            current = key if not value else None
            continue
        item = re.match(r"^\s+-\s+(.+?)\s*$", line)
        if item and current:
            if not isinstance(data[current], list):
                data[current] = [] if data[current] == "" else [data[current]]
            data[current].append(unquote(item.group(1)))
            continue
        errors.append(f"{path}:{number}: unsupported front-matter syntax")
    return data, lines[end + 1 :], errors


def values(data, key):
    value = data.get(key, [])
    if isinstance(value, list):
        return [str(x) for x in value if str(x)]
    return [str(value)] if value else []


def resolve_ref(ref: str, source: Path, ids: dict[str, Path], yaml_ids: dict[str, Path], root: Path):
    if ref in ids:
        return True
    if ref in yaml_ids:
        return True
    if ref in {"N/A", "none", "inherit", "embedded-in-entity-card"}:
        return True
    if "/" not in ref and not ref.endswith((".md", ".yml", ".yaml")):
        return False
    target = (root / source).parent.joinpath(ref).resolve()
    return target.is_file() and target.suffix.lower() in {".md", ".yml", ".yaml"} and root in target.parents


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Audit retained design Markdown links, principles, and canonical references."
    )
    parser.add_argument("--root", type=Path, default=Path("."), help="repository root (default: current directory)")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    design = root / "design"
    if not design.is_dir():
        print(f"VIOLATION: design directory not found: {design}")
        return 1

    docs = sorted(design.rglob("*.md"))
    principles = set()
    records = {}
    violations = []
    ids = defaultdict(list)
    for path in docs:
        rel = path.relative_to(root)
        data, body, errors = front_matter(rel)
        violations.extend(errors)
        records[rel] = (data, body)
        if data.get("id"):
            ids[str(data["id"])].append(rel)

    for ident, paths in sorted(ids.items()):
        if len(paths) > 1:
            violations.append(f"duplicate id {ident}: {', '.join(map(str, paths))}")

    id_map = {ident: paths[0] for ident, paths in ids.items() if len(paths) == 1}
    content = root / "design" / "content"
    yaml_ids = {}
    if content.is_dir():
        for yaml in content.rglob("*.yml"):
            yaml_ids[".".join(yaml.relative_to(content).with_suffix("").parts)] = yaml.relative_to(root)
        for yaml in content.rglob("*.yaml"):
            yaml_ids[".".join(yaml.relative_to(content).with_suffix("").parts)] = yaml.relative_to(root)
    if not (root / "README.md").is_file():
        violations.append("missing project README.md")
    for path, (data, body) in records.items():
        for key in REFERENCE_KEYS:
            for ref in values(data, key):
                if not resolve_ref(ref, path, id_map, yaml_ids, root):
                    violations.append(f"{path}: unresolved {key}: {ref}")

        text = "\n".join(body)
        for target in LINK.findall(text):
            target = target.strip().split("#", 1)[0].split("?", 1)[0].strip("<>")
            if not target or re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", target) or target.startswith("#"):
                continue
            link_path = (path.parent / target).resolve()
            link_path = (root / path).parent.joinpath(target).resolve()
            if not link_path.is_file() and not link_path.is_dir():
                violations.append(f"{path}: broken Markdown link: {target}")

    print(f"Audited {len(docs)} Markdown files")
    if violations:
        print(f"Found {len(violations)} violation(s):")
        for violation in sorted(set(violations)):
            print(f"- {violation}")
        return 1
    print("No violations found")
    return 0


if __name__ == "__main__":
    sys.exit(main())
