"""Generate ``src/api/generated.ts`` from the FastAPI OpenAPI schema.

Run from the repository root:

    server/.venv/bin/python -m server.generate_types

The generator is intentionally dependency-free (apart from FastAPI itself) so
the frontend does not need an npm code-generation package.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = REPO_ROOT / "src" / "api" / "generated.ts"
_IDENTIFIER = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*$")


def _load_app():
    try:
        from .main import app
    except ImportError:
        sys.path.insert(0, str(REPO_ROOT))
        from server.main import app
    return app


def _literal(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _union(types: list[str]) -> str:
    seen: list[str] = []
    for value in types:
        if value not in seen:
            seen.append(value)
    if not seen:
        return "unknown"
    if len(seen) == 1:
        return seen[0]
    return " | ".join(seen)


def ts_type(schema: Any, *, indent: int = 0) -> str:
    if schema is None or schema is True:
        return "unknown"
    if schema is False:
        return "never"
    if not isinstance(schema, dict):
        return "unknown"

    if "$ref" in schema:
        return str(schema["$ref"]).rsplit("/", 1)[-1]

    for key in ("anyOf", "oneOf"):
        if key in schema and isinstance(schema[key], list):
            return _union([ts_type(item, indent=indent) for item in schema[key]])

    if "allOf" in schema and isinstance(schema["allOf"], list):
        parts = [ts_type(item, indent=indent) for item in schema["allOf"]]
        if "nullable" in schema and schema["nullable"]:
            parts.append("null")
        return " & ".join(parts)

    if "enum" in schema and isinstance(schema["enum"], list):
        result = _union([_literal(value) for value in schema["enum"]])
        if schema.get("nullable") and "null" not in result:
            result = f"{result} | null"
        return result

    if "const" in schema:
        return _literal(schema["const"])

    schema_type = schema.get("type")
    if isinstance(schema_type, list):
        result = _union([ts_type({**schema, "type": item}, indent=indent) for item in schema_type])
    elif schema_type == "string":
        result = "string"
    elif schema_type in {"integer", "number"}:
        result = "number"
    elif schema_type == "boolean":
        result = "boolean"
    elif schema_type == "null":
        result = "null"
    elif schema_type == "array":
        result = f"Array<{ts_type(schema.get('items'), indent=indent)}>"
    elif schema_type == "object" or "properties" in schema or "additionalProperties" in schema:
        properties = schema.get("properties")
        if isinstance(properties, dict) and properties:
            required = set(schema.get("required") or [])
            lines = ["{"]
            for name, property_schema in properties.items():
                optional = "" if name in required else "?"
                key = name if _IDENTIFIER.match(name) else _literal(name)
                lines.append(
                    f"{'  ' * (indent + 1)}{key}{optional}: "
                    f"{ts_type(property_schema, indent=indent + 1)};"
                )
            lines.append(f"{'  ' * indent}}}")
            result = "\n".join(lines)
        else:
            additional = schema.get("additionalProperties")
            if isinstance(additional, dict):
                result = f"Record<string, {ts_type(additional, indent=indent)}>"
            else:
                result = "Record<string, unknown>"
    else:
        result = "unknown"

    if schema.get("nullable") and result != "null" and "| null" not in result:
        result = f"{result} | null"
    return result


def _description(schema: dict[str, Any], indent: int) -> list[str]:
    description = schema.get("description")
    if not isinstance(description, str) or not description.strip():
        return []
    text = " ".join(description.split())
    return [f"{'  ' * indent}/** {text} */"]


def _schema_declaration(name: str, schema: dict[str, Any]) -> str:
    if "enum" in schema and isinstance(schema["enum"], list):
        return f"export type {name} = {ts_type(schema)};\n"
    if "allOf" in schema or "anyOf" in schema or "oneOf" in schema:
        return f"export type {name} = {ts_type(schema)};\n"

    properties = schema.get("properties")
    if not isinstance(properties, dict) or not properties:
        return f"export type {name} = {ts_type(schema)};\n"

    required = set(schema.get("required") or [])
    lines = [f"export interface {name} {{"]
    for property_name, property_schema in properties.items():
        optional = "" if property_name in required else "?"
        key = property_name if _IDENTIFIER.match(property_name) else _literal(property_name)
        if isinstance(property_schema, dict):
            lines.extend(_description(property_schema, 1))
        lines.append(
            f"  {key}{optional}: {ts_type(property_schema, indent=1)};"
        )
    lines.append("}")
    return "\n".join(lines) + "\n"


def _operation_type(operation: dict[str, Any]) -> str | None:
    response_schema: Any = None
    responses = operation.get("responses")
    if isinstance(responses, dict):
        for status in ("200", "201", "202", "204", "default"):
            response = responses.get(status)
            if not isinstance(response, dict):
                continue
            content = response.get("content")
            if isinstance(content, dict):
                for media_type in ("application/json", "text/csv", "text/plain"):
                    media = content.get(media_type)
                    if isinstance(media, dict) and "schema" in media:
                        response_schema = media["schema"]
                        break
            if response_schema is not None:
                break
    if response_schema is None:
        return None

    lines = ["{"]
    request_body = operation.get("requestBody")
    if isinstance(request_body, dict):
        content = request_body.get("content")
        if isinstance(content, dict):
            for media_type in ("application/json", "application/x-www-form-urlencoded"):
                media = content.get(media_type)
                if isinstance(media, dict) and "schema" in media:
                    lines.append(f"    request: {ts_type(media['schema'])};")
                    break
    lines.append(f"    response: {ts_type(response_schema)};")
    lines.append("  }")
    return "\n".join(lines)


def generate(schema: dict[str, Any]) -> str:
    components = schema.get("components", {}).get("schemas", {})
    lines = [
        "/* eslint-disable */",
        "/**",
        " * AUTO-GENERATED FILE - DO NOT EDIT.",
        " * Generated from the FastAPI OpenAPI schema by:",
        " *   server/.venv/bin/python -m server.generate_types",
        " */",
        "",
    ]

    for name in sorted(components):
        component = components[name]
        if not isinstance(component, dict):
            continue
        lines.extend(_description(component, 0))
        lines.append(_schema_declaration(name, component))

    paths = schema.get("paths", {})
    operations: list[str] = []
    for path in sorted(paths):
        path_item = paths[path]
        if not isinstance(path_item, dict):
            continue
        for method in ("get", "post", "put", "patch", "delete"):
            operation = path_item.get(method)
            if not isinstance(operation, dict):
                continue
            operation_type = _operation_type(operation)
            if operation_type is None:
                continue
            key = f"{method.upper()} {path}"
            operations.append(f"  {_literal(key)}: {operation_type};")

    if operations:
        lines.append("export interface ApiOperations {")
        lines.extend(operations)
        lines.append("}")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    app = _load_app()
    schema = app.openapi()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(generate(schema), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} ({len(schema.get('components', {}).get('schemas', {}))} schemas)")


if __name__ == "__main__":
    main()
