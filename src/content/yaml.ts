export class YamlContentError extends Error {
  readonly source: string;

  constructor(message: string, source = "content") {
    super(`${source}: ${message}`);
    this.source = source;
    this.name = "YamlContentError";
  }
}

type YamlValue = null | boolean | number | string | YamlValue[] | { [key: string]: YamlValue };
type Row = { line: number; indent: number; text: string };

function fail(source: string, line: number, message: string): never {
  throw new YamlContentError(`line ${line}: ${message}`, source);
}

function stripComment(value: string): string {
  let quote = "";
  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if ((character === "\"" || character === "'") && value[i - 1] !== "\\") quote = quote === character ? "" : quote || character;
    if (character === "#" && !quote && (i === 0 || /\s/.test(value[i - 1]))) return value.slice(0, i).trimEnd();
  }
  return value;
}

function splitFlow(value: string, source: string, line: number): string[] {
  const result: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if ((character === "\"" || character === "'") && value[i - 1] !== "\\") quote = quote === character ? "" : quote || character;
    if (quote) continue;
    if (character === "[" || character === "{") depth++;
    if (character === "]" || character === "}") depth--;
    if (depth < 0) fail(source, line, "unbalanced flow value");
    if (character === "," && depth === 0) {
      result.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (quote || depth !== 0) fail(source, line, "unbalanced flow value");
  const last = value.slice(start).trim();
  if (last) result.push(last);
  return result;
}

function scalar(value: string, source: string, line: number): YamlValue {
  const text = value.trim();
  if (!text) return {};
  if (text === "null" || text === "~") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text)) return Number(text);
  if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replaceAll('\\"', '"');
  }
  if (text.startsWith("[") && text.endsWith("]")) return splitFlow(text.slice(1, -1), source, line).map(item => scalar(item, source, line));
  if (text.startsWith("{") && text.endsWith("}")) {
    const result: { [key: string]: YamlValue } = {};
    for (const item of splitFlow(text.slice(1, -1), source, line)) {
      const separator = item.indexOf(":");
      if (separator < 1) fail(source, line, "invalid flow mapping");
      const key = item.slice(0, separator).trim();
      if (key in result) fail(source, line, `duplicate key ${key}`);
      result[key] = scalar(item.slice(separator + 1), source, line);
    }
    return result;
  }
  return text;
}

function rows(text: string, source: string): Row[] {
  return text.split(/\r?\n/).map((raw, index) => ({
    line: index + 1,
    indent: raw.match(/^ */)?.[0].length ?? 0,
    text: stripComment(raw).trim(),
  })).filter(row => row.text);
}

export function parseYaml(text: string, source = "content.yml"): Record<string, YamlValue> {
  const input = rows(text, source);
  if (!input.length || input[0].indent !== 0 || input[0].text.startsWith("-")) fail(source, input[0]?.line ?? 1, "root must be a mapping");

  function block(at: number, indent: number): [YamlValue, number] {
    if (at >= input.length || input[at].indent < indent) return [{}, at];
    if (input[at].indent !== indent) fail(source, input[at].line, `expected indentation ${indent}`);
    const list = input[at].text.startsWith("- ");
    const result: YamlValue = list ? [] : {};
    while (at < input.length && input[at].indent === indent) {
      const row = input[at];
      if (list) {
        if (!row.text.startsWith("- ")) break;
        const rest = row.text.slice(2).trim();
        if (!rest) {
          const [value, next] = block(at + 1, indent + 2);
          (result as YamlValue[]).push(value);
          at = next;
          continue;
        }
        const separator = rest.indexOf(":");
        if (rest.startsWith("[") || rest.startsWith("{")) {
          (result as YamlValue[]).push(scalar(rest, source, row.line));
          at++;
          continue;
        }
        if (separator > 0) {
          const object: { [key: string]: YamlValue } = {};
          const key = rest.slice(0, separator).trim();
          const value = rest.slice(separator + 1).trim();
          if (value) {
            object[key] = scalar(value, source, row.line);
            at++;
          } else {
            const [nested, next] = block(at + 1, indent + 2);
            object[key] = nested;
            at = next;
          }
          const [extra, next] = block(at, indent + 2);
          if (extra && typeof extra === "object" && !Array.isArray(extra)) {
            for (const [extraKey, extraValue] of Object.entries(extra)) {
              if (extraKey in object) fail(source, row.line, `duplicate key ${extraKey}`);
              object[extraKey] = extraValue;
            }
            at = next;
          }
          (result as YamlValue[]).push(object);
          continue;
        }
        (result as YamlValue[]).push(scalar(rest, source, row.line));
        at++;
        continue;
      }
      const separator = row.text.indexOf(":");
      if (separator < 1) fail(source, row.line, "expected mapping key");
      const key = row.text.slice(0, separator).trim();
      if (key in result) fail(source, row.line, `duplicate key ${key}`);
      const value = row.text.slice(separator + 1).trim();
      if (value) {
        (result as { [key: string]: YamlValue })[key] = scalar(value, source, row.line);
        at++;
      } else {
        const [nested, next] = block(at + 1, indent + 2);
        (result as { [key: string]: YamlValue })[key] = nested;
        at = next;
      }
    }
    return [result, at];
  }

  const [value, at] = block(0, 0);
  if (at !== input.length) fail(source, input[at].line, "unparsed YAML");
  return value as Record<string, YamlValue>;
}
