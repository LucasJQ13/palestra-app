const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');
const supabaseRoot = path.join(root, 'supabase');
const outputRoot = path.join(supabaseRoot, 'rpc');
const inventoryPath = path.join(root, 'docs', 'supabase', 'SCHEMA_INVENTORY.md');

const criticalPrefixes = [
  'admin_',
  'accept_',
  'assign_',
  'archive_',
  'create_',
  'delete_',
  'issue_',
  'register_',
  'remove_',
  'repair_',
  'resolve_',
  'respond_',
  'restore_',
  'restrict_',
  'review_',
  'save_',
  'send_',
  'set_',
  'share_',
  'update_',
  'validate_'
];

const purposeOverrides = {
  get_my_profile: 'Obtener el perfil normalizado de la sesion autenticada.',
  admin_get_users: 'Listar usuarios que el actor puede administrar.',
  admin_update_user: 'Actualizar datos, estado y rango de un usuario dentro del alcance permitido.',
  issue_profile_credential: 'Emitir una nueva credencial QR opaca para el usuario autenticado.',
  validate_profile_credential: 'Validar una credencial QR contra los datos persistidos.',
  create_notification_intent: 'Crear una intencion persistida para entrega de notificaciones.',
  register_push_token: 'Registrar o actualizar el token push del dispositivo autenticado.'
};

function walk(dir, extensions) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, extensions));
    } else if (extensions.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function propertyName(node) {
  if (!node) return null;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return node.getText();
}

function readRpcCalls() {
  const calls = new Map();
  const sourceFiles = walk(srcRoot, ['.ts', '.tsx']);

  for (const filePath of sourceFiles) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'rpc' &&
        node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        const name = node.arguments[0].text;
        const params = new Set();
        const payload = node.arguments[1];
        if (payload && ts.isObjectLiteralExpression(payload)) {
          for (const property of payload.properties) {
            if (
              ts.isPropertyAssignment(property) ||
              ts.isShorthandPropertyAssignment(property) ||
              ts.isMethodDeclaration(property)
            ) {
              const key = propertyName(property.name);
              if (key) params.add(key);
            }
            if (ts.isSpreadAssignment(property)) {
              params.add('[objeto expandido: revisar llamada]');
            }
          }
        } else if (payload) {
          params.add(`[payload dinamico: ${payload.getText(sourceFile)}]`);
        }

        if (!calls.has(name)) {
          calls.set(name, { name, params: new Set(), usages: [] });
        }
        const record = calls.get(name);
        params.forEach((param) => record.params.add(param));
        record.usages.push({
          file: relative(filePath),
          line: lineOf(sourceFile, node)
        });
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return calls;
}

function readInventoryReturns() {
  const returns = new Map();
  if (!fs.existsSync(inventoryPath)) return returns;
  const lines = fs.readFileSync(inventoryPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\| `([^`]+)` \| ([^|]*) \| ([^|]*) \|$/);
    if (match) {
      returns.set(match[1], {
        documentedParams: match[2].trim(),
        expectedReturn: match[3].trim()
      });
    }
  }
  return returns;
}

function readSqlDefinitions(rpcNames) {
  const definitions = new Map([...rpcNames].map((name) => [name, []]));
  const sqlFiles = walk(supabaseRoot, ['.sql']);

  for (const filePath of sqlFiles) {
    const text = fs.readFileSync(filePath, 'utf8');
    const sourceLines = text.split(/\r?\n/);
    for (let index = 0; index < sourceLines.length; index += 1) {
      const line = sourceLines[index];
      const match = line.match(
        /create\s+(?:or\s+replace\s+)?function\s+public\.([a-z_][a-z0-9_]*)\s*\(/i
      );
      if (!match || !definitions.has(match[1])) continue;

      const name = match[1];
      let end = index;
      while (end < sourceLines.length - 1 && end - index < 500) {
        if (/\$\$\s*;\s*$/.test(sourceLines[end])) break;
        end += 1;
      }
      const block = sourceLines.slice(index, end + 1).join('\n');
      const tables = new Set();
      const tableRegex = /\b(?:from|join|insert\s+into|update|delete\s+from)\s+public\.([a-z_][a-z0-9_]*)/gi;
      let tableMatch;
      while ((tableMatch = tableRegex.exec(block))) {
        if (tableMatch[1] !== name) tables.add(tableMatch[1]);
      }

      definitions.get(name).push({
        file: relative(filePath),
        line: index + 1,
        tables: [...tables].sort()
      });
    }
  }

  return definitions;
}

function humanize(name) {
  return name.replace(/_/g, ' ');
}

function purposeFor(name) {
  if (purposeOverrides[name]) return purposeOverrides[name];
  if (name.startsWith('get_') || name.startsWith('admin_get_')) {
    return `Consultar ${humanize(name.replace(/^(admin_)?get_/, ''))}.`;
  }
  if (name.startsWith('create_') || name.startsWith('admin_create_')) {
    return `Crear ${humanize(name.replace(/^(admin_)?create_/, ''))}.`;
  }
  if (name.startsWith('update_') || name.startsWith('admin_update_')) {
    return `Actualizar ${humanize(name.replace(/^(admin_)?update_/, ''))}.`;
  }
  if (name.startsWith('admin_')) {
    return `Operacion administrativa: ${humanize(name.slice(6))}.`;
  }
  return `Operacion remota: ${humanize(name)}.`;
}

function riskFor(name) {
  if (
    /delete|force_release|repair|confirm|approve|role|permission|credential|user|profile/.test(name)
  ) {
    return 'Critico';
  }
  if (criticalPrefixes.some((prefix) => name.startsWith(prefix))) {
    return 'Alto';
  }
  return 'Moderado';
}

function markdownFor(record, inventory, definitions) {
  const params = [...record.params].sort();
  const inventoryEntry = inventory.get(record.name);
  const sqlDefinitions = definitions.get(record.name) || [];
  const tables = [...new Set(sqlDefinitions.flatMap((definition) => definition.tables))].sort();
  const critical = riskFor(record.name);

  const lines = [
    `# RPC: ${record.name}`,
    '',
    '## Estado',
    '',
    sqlDefinitions.length
      ? 'Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.'
      : 'Pendiente de completar desde Supabase. No se encontro una definicion SQL versionada en el repositorio.',
    '',
    '> Esta ficha es documental. No es una migracion y no debe ejecutarse.',
    '',
    '## Criticidad',
    '',
    `**${critical}**.`,
    '',
    '## Proposito',
    '',
    purposeFor(record.name),
    '',
    '## Uso desde frontend',
    ''
  ];

  record.usages
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .forEach((usage) => lines.push(`- \`${usage.file}:${usage.line}\``));

  lines.push('', '## Parametros enviados por el frontend', '');
  if (params.length) {
    params.forEach((param) => lines.push(`- \`${param}\``));
  } else {
    lines.push('- Sin parametros en las llamadas detectadas.');
  }

  if (inventoryEntry) {
    lines.push(
      '',
      'Contrato documentado previamente:',
      '',
      `- Parametros: ${inventoryEntry.documentedParams}.`
    );
  }

  lines.push('', '## Respuesta esperada', '');
  lines.push(
    inventoryEntry
      ? inventoryEntry.expectedReturn
      : 'Pendiente de confirmar. El frontend consume el resultado de Supabase sin un contrato documentado estable.'
  );

  lines.push('', '## Tablas afectadas o consultadas', '');
  if (tables.length) {
    tables.forEach((table) => lines.push(`- \`${table}\` (detectada en SQL versionado).`));
  } else {
    lines.push('- Pendiente de completar desde Supabase o desde una definicion SQL canonica.');
  }

  lines.push('', '## Referencias SQL versionadas', '');
  if (sqlDefinitions.length) {
    sqlDefinitions.forEach((definition) => {
      lines.push(`- \`${definition.file}:${definition.line}\``);
    });
    lines.push(
      '',
      'Estas referencias pueden representar versiones historicas distintas. No se copia un cuerpo como canonico porque el repositorio no certifica cual esta desplegado actualmente.'
    );
  } else {
    lines.push('- Pendiente de completar desde Supabase.');
  }

  lines.push(
    '',
    '## Validaciones que deben confirmarse',
    '',
    '- Usuario autenticado cuando la operacion no sea publica.',
    '- Estado aprobado cuando accede a datos internos.',
    '- Rol o permiso suficiente.',
    '- Alcance de comunidad/provincia cuando corresponda.',
    '- `security definer` y `set search_path = public` si eleva privilegios.',
    '- Grants limitados a los roles necesarios.',
    '- Retorno y errores compatibles con el frontend.',
    '',
    '## Pendiente de verificacion remota',
    '',
    '- Firma SQL exacta desplegada.',
    '- Cuerpo SQL vigente.',
    '- Grants y propietario de la funcion.',
    '- Policies y tablas relacionadas.',
    '- Pruebas positivas y negativas por rol.',
    ''
  );

  return lines.join('\n');
}

function edgeFunctionIndex() {
  const edgeCalls = new Map();
  for (const filePath of walk(srcRoot, ['.ts', '.tsx'])) {
    const text = fs.readFileSync(filePath, 'utf8');
    const regex = /functions\.invoke\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(text))) {
      const before = text.slice(0, match.index);
      const line = before.split(/\r?\n/).length;
      if (!edgeCalls.has(match[1])) edgeCalls.set(match[1], []);
      edgeCalls.get(match[1]).push(`${relative(filePath)}:${line}`);
    }
  }

  return edgeCalls;
}

function writeCatalog() {
  fs.mkdirSync(outputRoot, { recursive: true });
  const calls = readRpcCalls();
  const inventory = readInventoryReturns();
  const definitions = readSqlDefinitions(calls.keys());
  const edgeFunctions = edgeFunctionIndex();

  const generated = [];
  for (const record of [...calls.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    const fileName = `${record.name}.md`;
    fs.writeFileSync(
      path.join(outputRoot, fileName),
      markdownFor(record, inventory, definitions),
      'utf8'
    );
    generated.push(record.name);
  }

  const sqlBacked = generated.filter((name) => (definitions.get(name) || []).length > 0);
  const pending = generated.filter((name) => (definitions.get(name) || []).length === 0);
  const critical = generated.filter((name) => riskFor(name) === 'Critico');

  const readme = [
    '# Catalogo de funciones remotas',
    '',
    'Este directorio documenta todas las RPC invocadas por el frontend.',
    '',
    '> Los archivos son documentales. No son migraciones ejecutables.',
    '',
    '## Estado del catalogo',
    '',
    `- RPC usadas por frontend: **${generated.length}**.`,
    `- Con una o mas definiciones SQL candidatas en el repo: **${sqlBacked.length}**.`,
    `- Pendientes de obtener desde Supabase: **${pending.length}**.`,
    `- Marcadas con criticidad critica: **${critical.length}**.`,
    `- Edge Functions invocadas: **${edgeFunctions.size}**.`,
    '',
    'Una definicion SQL versionada no prueba que sea la version desplegada en produccion. Las funciones con multiples referencias requieren comparar el export remoto antes de elegir una firma canonica.',
    '',
    '## RPC',
    '',
    '| Funcion | Criticidad | SQL en repo | Ficha |',
    '| --- | --- | --- | --- |',
    ...generated.map((name) => {
      const count = (definitions.get(name) || []).length;
      return `| \`${name}\` | ${riskFor(name)} | ${count ? `${count} referencia(s)` : 'Pendiente'} | [Abrir](./${name}.md) |`;
    }),
    '',
    '## Edge Functions',
    '',
    '| Funcion | Implementacion versionada | Uso frontend |',
    '| --- | --- | --- |',
    ...[...edgeFunctions.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, usages]) => {
        const implementation = `../functions/${name}/index.ts`;
        const exists = fs.existsSync(path.join(supabaseRoot, 'functions', name, 'index.ts'));
        return `| \`${name}\` | ${exists ? `[\`index.ts\`](../functions/${name}/index.ts)` : 'Pendiente'} | ${usages.map((usage) => `\`${usage}\``).join('<br>')} |`;
      }),
    '',
    '## Regeneracion',
    '',
    '```powershell',
    'node scripts/generate-rpc-catalog.js',
    '```',
    '',
    'El generador toma las llamadas del frontend, el inventario documental y las definiciones SQL del repositorio. No consulta ni modifica Supabase.',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(outputRoot, 'README.md'), readme, 'utf8');

  console.log(
    JSON.stringify(
      {
        rpc: generated.length,
        sqlBacked: sqlBacked.length,
        pending: pending.length,
        critical: critical.length,
        edgeFunctions: edgeFunctions.size
      },
      null,
      2
    )
  );
}

writeCatalog();
