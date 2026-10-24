import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { stickerSvg } from '../lib/stickers';

/**
 * Message box that uses the phone's own keyboard (autocorrect, suggestions, voice typing)
 * but can hold stickers inline between words. Stickers are saved as {{st:id}} in the text.
 */
export interface RichInputHandle { insertSticker: (id: string) => void; insertText: (t: string) => void; clear: () => void; focus: () => void; blur: () => void }

const stickerSrc = (id: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(stickerSvg(id, 96));

export function serialize(el: HTMLElement): string {
  let out = '';
  el.childNodes.forEach(function walk(n: ChildNode) {
    if (n.nodeType === 3) out += n.textContent ?? '';
    else if (n instanceof HTMLImageElement && n.dataset.st) out += `{{st:${n.dataset.st}}}`;
    else if (n instanceof HTMLBRElement) out += '\n';
    else if (n instanceof HTMLElement) { if ((n.tagName === 'DIV' || n.tagName === 'P') && out && !out.endsWith('\n')) out += '\n'; n.childNodes.forEach(walk); }
  });
  return out.replace(/ /g, ' ');
}

export const RichInput = forwardRef<RichInputHandle, { placeholder: string; onChange: (v: string) => void; onFocus: () => void; onBlur: () => void; onEnter: () => void }>(
  function RichInput({ placeholder, onChange, onFocus, onBlur, onEnter }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const range = useRef<Range | null>(null);
    const save = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && el.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
    };
    useEffect(() => {
      document.addEventListener('selectionchange', save);
      return () => document.removeEventListener('selectionchange', save);
    }, []);
    const insertNode = (node: Node) => {
      const box = el.current!;
      let r = range.current;
      if (!r || !box.contains(r.startContainer)) { r = document.createRange(); r.selectNodeContents(box); r.collapse(false); }
      r.deleteContents();
      r.insertNode(node);
      r.setStartAfter(node); r.collapse(true);
      range.current = r;
      const sel = window.getSelection();
      if (sel && document.activeElement === box) { sel.removeAllRanges(); sel.addRange(r); }
      onChange(serialize(box));
    };
    useImperativeHandle(ref, () => ({
      insertSticker(id) {
        const img = document.createElement('img');
        img.src = stickerSrc(id); img.dataset.st = id; img.alt = '';
        img.className = 'inline-block align-middle w-7 h-7 mx-[1px]';
        insertNode(img);
      },
      insertText(t) { insertNode(document.createTextNode(t)); },
      clear() { if (el.current) el.current.innerHTML = ''; range.current = null; onChange(''); },
      focus() { el.current?.focus(); },
      blur() { el.current?.blur(); }
    }));
    return (
      <div ref={el} role="textbox" aria-label="Message" aria-multiline="true" contentEditable suppressContentEditableWarning
        data-placeholder={placeholder} spellCheck autoCorrect="on" autoCapitalize="sentences"
        className="rich-input flex-1 min-w-0 bg-transparent outline-none px-2 py-[5px] min-h-[32px] max-h-32 overflow-y-auto text-[16px] leading-[22px] break-words"
        onInput={() => onChange(serialize(el.current!))}
        onFocus={onFocus} onBlur={() => { save(); onBlur(); }}
        onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); onEnter(); } }} />
    );
  }
);
