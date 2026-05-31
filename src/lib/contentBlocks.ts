import { ContentEditorBlock, AppTabSectionType } from './profiles';
import { defaultTabs } from './navigationConstants';

export function fallbackContentKey(section: string, title: string, date?: string) {
  return `${section}:${date ? `${date}:` : ''}${title}`;
}

export function splitConfigValue(value: string) {
  const parts = value.split('|').map((item) => item.trim());
  return [parts[0] ?? '', parts[1] ?? ''];
}

function uniqueBlockId(seed: string, index: number) {
  return `${seed || 'card'}-${Date.now()}-${index}`;
}

function blockSummary(block: ContentEditorBlock) {
  return [block.title, block.text, block.imageUrl, block.linkLabel, block.linkUrl]
    .map((item) => item?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

export function normalizeContentCards(blocks: ContentEditorBlock[] | null | undefined, title = '', body = ''): ContentEditorBlock[] {
  const source = Array.isArray(blocks) ? blocks : [];
  if (source.some((block) => block.type === 'card' || block.title != null || block.text != null || block.imageUrl != null || block.linkUrl != null)) {
    return source
      .map((block, index) => {
        const normalized: ContentEditorBlock = {
          ...block,
          id: block.id || uniqueBlockId('card', index),
          type: 'card',
          title: block.title ?? (block.type === 'titulo' ? block.value : ''),
          text: block.text ?? (block.type === 'texto' ? block.value : ''),
          imageUrl: block.imageUrl ?? (block.type === 'imagen' ? block.value : ''),
          linkLabel: block.linkLabel ?? (block.type === 'enlace' ? splitConfigValue(block.value)[0] : ''),
          linkUrl: block.linkUrl ?? (block.type === 'enlace' ? splitConfigValue(block.value)[1] : ''),
          isVisible: block.isVisible !== false,
          sortOrder: Number.isFinite(block.sortOrder) ? block.sortOrder : index + 1,
          value: ''
        };
        normalized.value = blockSummary(normalized);
        return normalized;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const cards: ContentEditorBlock[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const block = source[index];
    if (block.type === 'titulo') {
      cards.push({
        id: block.id || uniqueBlockId('card', index),
        type: 'card',
        title: block.value,
        text: '',
        imageUrl: '',
        linkLabel: '',
        linkUrl: '',
        isVisible: true,
        sortOrder: cards.length + 1,
        value: block.value
      });
      continue;
    }

    const last = cards[cards.length - 1];
    const target = last && !last.text && block.type === 'texto'
      ? last
      : {
          id: block.id || uniqueBlockId('card', index),
          type: 'card' as const,
          title: '',
          text: '',
          imageUrl: '',
          linkLabel: '',
          linkUrl: '',
          isVisible: true,
          sortOrder: cards.length + 1,
          value: ''
        };

    if (!last || target !== last) {
      cards.push(target);
    }

    if (block.type === 'texto' || block.type === 'campo' || block.type === 'modulo') {
      target.text = [target.text, block.type === 'modulo' ? tabLabelFromKey(block.value) : block.value].filter(Boolean).join('\n');
    } else if (block.type === 'imagen') {
      target.imageUrl = block.value;
    } else if (block.type === 'enlace') {
      const [label, url] = splitConfigValue(block.value);
      target.linkLabel = label;
      target.linkUrl = url;
    }
    target.value = blockSummary(target);
  }

  if (cards.length === 0 && (title.trim() || body.trim())) {
    cards.push({
      id: uniqueBlockId('card', 0),
      type: 'card',
      title,
      text: body,
      imageUrl: '',
      linkLabel: '',
      linkUrl: '',
      isVisible: true,
      sortOrder: 1,
      value: [title, body].filter(Boolean).join(' ')
    });
  }

  return cards;
}

export function prepareContentCardsForSave(blocks: ContentEditorBlock[]) {
  const seen = new Set<string>();
  return blocks
    .map((block, index) => {
      const normalized: ContentEditorBlock = {
        ...block,
        id: block.id || uniqueBlockId('card', index),
        type: 'card',
        title: block.title?.trim() ?? '',
        text: block.text?.trim() ?? '',
        imageUrl: block.imageUrl?.trim() ?? '',
        linkLabel: block.linkLabel?.trim() ?? '',
        linkUrl: block.linkUrl?.trim() ?? '',
        isVisible: block.isVisible !== false,
        sortOrder: index + 1,
        value: ''
      };
      normalized.value = blockSummary(normalized);
      return normalized;
    })
    .filter((block) => block.value.length > 0 || block.isVisible === false)
    .filter((block) => {
      const signature = [block.title, block.text, block.imageUrl, block.linkLabel, block.linkUrl, block.isVisible ? '1' : '0'].join('|').toLowerCase();
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
}

export function buildInitialBlocksForSection(sectionType: AppTabSectionType, title: string): ContentEditorBlock[] {
  const now = Date.now();
  if (sectionType === 'links') {
    return [
      { id: `card-${now}`, type: 'card', value: title, title, text: '', linkLabel: 'Instagram Palestra', linkUrl: 'https://www.instagram.com/infopalestra.argentina', imageUrl: '', isVisible: true, sortOrder: 1 }
    ];
  }
  if (sectionType === 'image_text') {
    return [
      { id: `card-${now}`, type: 'card', value: title, title, text: 'Contenido inicial de la seccion.', imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png', linkLabel: '', linkUrl: '', isVisible: true, sortOrder: 1 }
    ];
  }
  if (sectionType === 'form') {
    return [
      { id: `card-${now}`, type: 'card', value: title, title, text: 'Envianos tu consulta.', imageUrl: '', linkLabel: 'Panel de solicitudes', linkUrl: 'destino=Panel de solicitudes', isVisible: true, sortOrder: 1 }
    ];
  }
  if (sectionType === 'internal') {
    return [
      { id: `card-${now}`, type: 'card', value: title, title, text: tabLabelFromKey('inicio'), imageUrl: '', linkLabel: '', linkUrl: '', isVisible: true, sortOrder: 1 }
    ];
  }
  return [
    { id: `card-${now}`, type: 'card', value: title, title, text: 'Contenido inicial de la pagina.', imageUrl: '', linkLabel: '', linkUrl: '', isVisible: true, sortOrder: 1 }
  ];
}

export function tabLabelFromKey(key: string) {
  return defaultTabs.find((tab) => tab.key === key)?.label ?? key;
}
