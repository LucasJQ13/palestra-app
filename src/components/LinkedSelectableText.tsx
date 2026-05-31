import React from 'react';
import { Linking, Text, TextStyle, StyleProp } from 'react-native';
import { normalizeExternalUrl } from '../lib/urls';

const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function splitLinkedText(value: string) {
  const parts: Array<{ text: string; url?: string }> = [];
  let lastIndex = 0;
  value.replace(urlPattern, (match, _capture, offset) => {
    if (offset > lastIndex) {
      parts.push({ text: value.slice(lastIndex, offset) });
    }
    const trailing = match.match(/[),.;:!?]+$/)?.[0] ?? '';
    const cleanUrl = trailing ? match.slice(0, -trailing.length) : match;
    parts.push({ text: cleanUrl, url: normalizeExternalUrl(cleanUrl) });
    if (trailing) {
      parts.push({ text: trailing });
    }
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < value.length) {
    parts.push({ text: value.slice(lastIndex) });
  }
  return parts.length ? parts : [{ text: value }];
}

export function LinkedSelectableText({
  text,
  style,
  linkStyle,
  numberOfLines
}: {
  text: string;
  style: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text selectable style={style} numberOfLines={numberOfLines}>
      {splitLinkedText(text).map((part, index) => part.url ? (
        <Text key={`${part.url}-${index}`} style={linkStyle} onPress={() => Linking.openURL(part.url as string)}>
          {part.text}
        </Text>
      ) : (
        <Text key={`${part.text}-${index}`}>{part.text}</Text>
      ))}
    </Text>
  );
}
