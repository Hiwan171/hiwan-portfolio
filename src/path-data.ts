/**
 * Seção 3 — trajetória. Fonte: docs/02-trajetoria.md (confirmado pelo Hiwan, 16/11/2026).
 * Só anos com eventos (é um GROUP BY: 2021 não tem linha própria; o contrato de aprendiz é 2020–2021).
 */
import type { Tok } from './i18n';

export type Kind = 'role' | 'study' | 'cert' | 'build' | 'now';
export type PathYear = { year: number; items: { kind: Kind; title: string; where: string }[] };
/** Degrau do gráfico: `x` é o ano decimal em que o nível começa (ago/2025 = 2025.6). */
export type PathStep = { x: number; level: number; label: string; meta: string };

const q = (cols: { year: string; ev: string; evs: string }, table: string): Tok[] => [
  ['k', 'SELECT'], ['t', ' '], ['i', cols.year], ['p', ', '], ['k', 'STRING_AGG'], ['p', '('], ['i', cols.ev], ['p', ', '],
  ['s', "' · '"], ['p', ')'], ['t', ' '], ['k', 'AS'], ['t', ' '], ['i', cols.evs],
  ['t', ' '], ['k', 'FROM'], ['t', ' '], ['i', table],
  ['t', ' '], ['k', 'GROUP BY'], ['t', ' '], ['i', cols.year], ['t', ' '], ['k', 'ORDER BY'], ['t', ' '], ['i', cols.year], ['p', ';'],
];

export const pathData = {
  pt: {
    table: 'dbo.trajetoria',
    query: q({ year: 'ano', ev: 'evento', evs: 'eventos' }, 'dbo.trajetoria'),
    title: 'De aprendiz a sênior em cinco anos.',
    sub: 'agrupado por ano · fontes: LinkedIn e trabalho real',
    kinds: { role: 'cargo', study: 'formação', cert: 'certificação', build: 'construiu', now: 'hoje' } as Record<Kind, string>,
    year: 'ano',
    event: 'evento',
    events: 'eventos',
    rows: 'linhas',
    steps: [
      { x: 2019, level: 0, label: 'Estudante', meta: 'Ciência da Computação · UniBH' },
      { x: 2020.15, level: 1, label: 'Aprendiz', meta: 'Inova BH / Saúde BH' },
      { x: 2022, level: 2, label: 'Auxiliar de TI', meta: 'Colefar' },
      { x: 2023, level: 3, label: 'Assistente de TI', meta: 'Colefar' },
      { x: 2025.6, level: 4, label: 'Sênior', meta: 'redes e comunicação de dados · Colefar' },
    ] as PathStep[],
    now: { label: 'hoje', meta: '+ projetos para outras empresas' },
    years: [
      { year: 2019, items: [{ kind: 'study', title: 'Ciência da Computação', where: 'UniBH · 2019–2022' }] },
      { year: 2020, items: [
        { kind: 'role', title: 'Aprendiz de TI', where: 'Inova BH / Saúde BH · contrato 2020–2021' },
        { kind: 'build', title: 'Primeiro contato com Power BI', where: 'aprendendo com os mais experientes' },
      ] },
      { year: 2022, items: [
        { kind: 'role', title: 'Auxiliar de TI', where: 'Colefar · tempo integral' },
        { kind: 'build', title: 'Dashboards em Power BI', where: 'Colefar · desde 2022' },
      ] },
      { year: 2023, items: [
        { kind: 'role', title: 'Assistente de TI', where: 'Colefar' },
        { kind: 'study', title: 'Redes de Computadores', where: 'UNIASSELVI · 2023–2025' },
      ] },
      { year: 2024, items: [
        { kind: 'build', title: 'Views SQL para toda a gestão', where: 'Colefar · desde 2024' },
        { kind: 'build', title: 'Primeiros sites', where: 'desenvolvimento web' },
        { kind: 'cert', title: 'Power BI + SQL Server', where: 'Udemy · set/2024' },
        { kind: 'cert', title: 'Excel Avançado', where: 'UNIASSELVI · out/2024' },
      ] },
      { year: 2025, items: [
        { kind: 'role', title: 'Assistente de redes e comunicação de dados sênior', where: 'Colefar · ago/2025' },
        { kind: 'study', title: 'Redes de Computadores concluído', where: 'UNIASSELVI' },
        { kind: 'cert', title: 'Python 3', where: 'Udemy · set/2025' },
      ] },
      { year: 2026, items: [
        { kind: 'build', title: 'Cadastrador automático no Uplog', where: 'Python · SQL Server · API' },
        { kind: 'build', title: 'Quatro landing pages', where: 'Colefar · Ambientec · Colenorte · Biocoletas' },
        { kind: 'study', title: 'Curso de desenvolvimento web', where: 'para consolidar front-end e back-end' },
        { kind: 'now', title: 'Projetos para outras empresas', where: 'web · mobile · desktop · BI · automações' },
      ] },
    ] as PathYear[],
  },
  en: {
    table: 'dbo.career',
    query: q({ year: 'year', ev: 'event', evs: 'events' }, 'dbo.career'),
    title: 'From apprentice to senior in five years.',
    sub: 'grouped by year · sources: LinkedIn and real work',
    kinds: { role: 'role', study: 'education', cert: 'certificate', build: 'built', now: 'now' } as Record<Kind, string>,
    year: 'year',
    event: 'event',
    events: 'events',
    rows: 'rows',
    steps: [
      { x: 2019, level: 0, label: 'Student', meta: 'Computer Science · UniBH' },
      { x: 2020.15, level: 1, label: 'Apprentice', meta: 'Inova BH / Saúde BH' },
      { x: 2022, level: 2, label: 'Junior IT Assistant', meta: 'Colefar' },
      { x: 2023, level: 3, label: 'IT Assistant', meta: 'Colefar' },
      { x: 2025.6, level: 4, label: 'Senior', meta: 'network & data communications · Colefar' },
    ] as PathStep[],
    now: { label: 'now', meta: '+ projects for other companies' },
    years: [
      { year: 2019, items: [{ kind: 'study', title: 'Computer Science', where: 'UniBH · 2019–2022' }] },
      { year: 2020, items: [
        { kind: 'role', title: 'IT Apprentice', where: 'Inova BH / Saúde BH · 2020–2021 contract' },
        { kind: 'build', title: 'First steps with Power BI', where: 'learning from senior colleagues' },
      ] },
      { year: 2022, items: [
        { kind: 'role', title: 'IT Assistant (junior)', where: 'Colefar · full time' },
        { kind: 'build', title: 'Power BI dashboards', where: 'Colefar · since 2022' },
      ] },
      { year: 2023, items: [
        { kind: 'role', title: 'IT Assistant', where: 'Colefar' },
        { kind: 'study', title: 'Computer Networks', where: 'UNIASSELVI · 2023–2025' },
      ] },
      { year: 2024, items: [
        { kind: 'build', title: 'SQL views for every department', where: 'Colefar · since 2024' },
        { kind: 'build', title: 'First websites', where: 'web development' },
        { kind: 'cert', title: 'Power BI + SQL Server', where: 'Udemy · Sep 2024' },
        { kind: 'cert', title: 'Advanced Excel', where: 'UNIASSELVI · Oct 2024' },
      ] },
      { year: 2025, items: [
        { kind: 'role', title: 'Senior Network & Data Communications Assistant', where: 'Colefar · Aug 2025' },
        { kind: 'study', title: 'Computer Networks completed', where: 'UNIASSELVI' },
        { kind: 'cert', title: 'Python 3', where: 'Udemy · Sep 2025' },
      ] },
      { year: 2026, items: [
        { kind: 'build', title: 'Automated record loader for Uplog', where: 'Python · SQL Server · API' },
        { kind: 'build', title: 'Four landing pages', where: 'Colefar · Ambientec · Colenorte · Biocoletas' },
        { kind: 'study', title: 'Web development course', where: 'to consolidate front-end and back-end' },
        { kind: 'now', title: 'Projects for other companies', where: 'web · mobile · desktop · BI · automation' },
      ] },
    ] as PathYear[],
  },
};
