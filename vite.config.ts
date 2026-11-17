import { defineConfig, type Plugin } from 'vite';

/**
 * URL pública do site para canonical / og:url / og:image (o LinkedIn exige URL absoluta na imagem).
 * Uso: SITE_URL=https://dominio.com npm run build
 * Sem SITE_URL (dev, ou antes de haver domínio): canonical e og:url saem e a og:image fica relativa.
 */
function siteUrl(): Plugin {
  const url = (process.env.SITE_URL ?? '').replace(/\/+$/, '');
  return {
    name: 'site-url',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!url) {
          if (!ctx.server) console.warn('SITE_URL não definida: og:image relativa e sem canonical (defina antes do deploy).');
          html = html.replace(/^\s*<[^>]*data-site-url[^>]*>\s*$/gm, '');
        }
        return html.replace(/%SITE_URL%/g, url).replace(/\s*data-site-url/g, '');
      },
    },
  };
}

export default defineConfig({
  plugins: [siteUrl()],
});
