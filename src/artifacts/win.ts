import { dict, currentLang } from '../i18n';

/** Moldura comum das janelas de artefato: barra de título, corpo, rodapé com nota + "executar de novo". */
export function winHtml(opts: { cls: string; title: string; meta: string; body: string; note: string; sr: string }) {
  const t = dict[currentLang()].text;
  return `
    <div class="win ${opts.cls}">
      <div class="win__bar"><span>${opts.title}</span><span>${opts.meta}</span></div>
      ${opts.body}
      <p class="sr-only">${opts.sr}</p>
      <div class="win__foot">
        <span class="win__note">${opts.note}</span>
        <button class="sbtn sbtn--ghost" type="button" data-replay>${t['case.replay']}</button>
      </div>
    </div>`;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fmt = (v: number, d = 0) =>
  v.toLocaleString(document.documentElement.lang, { minimumFractionDigits: d, maximumFractionDigits: d });
