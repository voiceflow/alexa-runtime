import { escapeXmlCharacters } from 'ask-sdk';
import { create } from 'xmlbuilder2';

const XML_TAG = '<?xml version="1.0"?>';
const START_TAG = '<start>';
const END_TAG = '</start>';

// we cant just escape the ssml as a string because the ssml might contain nested nodes inside it
// (we would convert <empahis level="strong">text</emphasis> to ;ltempahis....)
// so instead we need to escape the texts inside the ssml nodes
export const encodeSSML = (ssmlText: string): string => {
  if (!ssmlText) return ssmlText;
  const xml = create(`${START_TAG}${ssmlText}${END_TAG}`);
  const text = xml
    .each(
      (node) => ({
        ...node,
        node: {
          ...node.node,
          textContent: escapeXmlCharacters(node.node.textContent ?? ''),
        },
      }),
      true,
      true
    )
    .toString();
  return text.slice(`${XML_TAG}${START_TAG}`.length, -END_TAG.length);
};
