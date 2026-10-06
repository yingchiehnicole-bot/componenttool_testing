import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';
import pkg from '../package.json';
import guideline from '../design-guideline.json';

const TEAM_NAME = 'Component Kit Builder';

// design-guideline.json ships with no `logo` field until /setup-logo fills it in.
const logoSvg = (guideline as { logo?: { light?: string } }).logo?.light;

const LOGO_PLACEHOLDER_CSS = `
  .sb-bar-logo-placeholder {
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 8px;
    border-radius: 9999px;
    border: 1.5px dashed #cbd5e1;
    background-image: repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%);
    background-size: 6px 6px;
    vertical-align: middle;
    flex-shrink: 0;
    position: relative;
    cursor: default;
  }
  .sidebar-header img[src^="data:image/svg+xml"] {
    width: 24px !important;
    height: 24px !important;
  }
  .sb-bar-logo-placeholder:hover::after {
    content: 'Show your logo — tell Claude your brand logo and it will show up here.';
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    width: 200px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #334155;
    font-size: 11px;
    line-height: 1.4;
    white-space: normal;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    z-index: 9999;
  }
`;

// brandImage must stay null: Storybook's brand slot only renders an <img> OR
// brandTitle text, never both. When there's no logo yet, brandTitle carries a
// small dashed-circle placeholder (with its own hover tooltip via injected
// CSS, since brandTitle is a static HTML string with no React event support)
// followed by the team name. Once /setup-logo sets logo.light, brandImage
// takes over and shows the real logo instead.
const theme = create({
  base: 'light',
  brandImage: logoSvg ? `data:image/svg+xml,${encodeURIComponent(logoSvg)}` : undefined,
  brandTitle: logoSvg
    ? TEAM_NAME
    : `<span style='display:flex;align-items:center'><span class='sb-bar-logo-placeholder'></span><span>${TEAM_NAME}</span></span>`,
  // No brandUrl: leaving it unset renders plain text/markup instead of a clickable link.
  brandUrl: null,
});

const style = document.createElement('style');
style.textContent = LOGO_PLACEHOLDER_CSS;
document.head.appendChild(style);

addons.setConfig({ theme });

addons.register('vyntahq/team-badge', () => {
  addons.add('vyntahq/team-badge/tool', {
    type: types.TOOL,
    title: 'Team badge',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: () => (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: theme.textColor,
          padding: '0 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {TEAM_NAME} · v{pkg.version}
      </span>
    ),
  });
});
