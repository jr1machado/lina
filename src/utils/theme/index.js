import { changeMenuColor, generateColors, mix, setRootColors } from './color'

export function changeElementColor(themeColors) {
  let colorsCssText = ''
  let cssText = ''
  const colors = generateColors(themeColors)
  for (const [key, value] of Object.entries(colors)) {
    cssText = cssText.replace(new RegExp('(:|\\s+)' + key, 'g'), '$1' + `${value}`)
    colorsCssText += `
    .color-${key}{color: ${value}!important;}
    .bg-${key}{background-color: ${value}!important;}
    .border-${key}{border-color: ${value}!important;}
    `
    if (['primary', 'success', 'info', 'warning', 'danger'].includes(key)) {
      const blendColor = mix('ffffff', value.replace(/#/g, ''), 35)
      const darken = mix('000000', value.replace(/#/g, ''), 10)
      const tooLightColor = mix('ffffff', value.replace(/#/g, ''), 90)
      colorsCssText =
        colorsCssText +
        `
        .el-button--${key}{
           border-color: var(--color-border);
        }
        .el-button--${key}:focus,
        .el-button--${key}:active,
        .el-button--${key}:hover {
          background-color: ${darken}!important;
          border-color: var(--color-border)!important;
        }
        .el-button--${key}.is-disabled,
        .el-button--${key}.is-disabled:active,
        .el-button--${key}.is-disabled:focus {
          background-color: ${blendColor}!important;
          border-color: var(--color-border);
        }
        .el-link.el-link--${key}{
          color: ${value}!important;
        }
        .el-link.el-link--${key}:hover {
          color: ${darken}!important;
        }
        .el-link.el-link--${key}.is-underline:hover:after,
        .el-link.el-link--${key}:after {
          border-color: ${value}!important;
        }
        .el-tag--dark.el-tag--${key} {
          background-color: ${value} !important;
        }
        .el-alert.el-alert--${key}.is-light {
          background-color: ${tooLightColor};
        }
      `
    }
  }

  colorsCssText = colorsCssText.replaceAll('\n', '')
  let styleTag = document.getElementById('themeStyle')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.setAttribute('id', 'themeStyle')
    document.head.appendChild(styleTag)
  }
  styleTag.innerText = cssText + colorsCssText
}

// 2026-09-04 - Web interface light/dark theme (users.Preference,
// category=lina, basic.ui_theme). Distinct from changeThemeColors above
// (platform-wide brand color customization, Settings > Interface) and
// from the per-user Luna *terminal window* theme (users.const.Themes) -
// this one toggles <html class="dark">, which both Element Plus's own
// dark stylesheet and the html.dark block in styles/default-theme.scss
// key off of. Mirrored to localStorage so main.js can apply it
// synchronously on the next load, before the preference API call
// returns (avoids a flash of the wrong theme).
export function applyUiTheme(theme) {
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  try {
    localStorage.setItem('ui_theme', isDark ? 'dark' : 'default')
  } catch (e) {
    // ignore (privacy mode / storage disabled)
  }
}

export function changeThemeColors(themeColors) {
  // 主题色现在完全由 CSS 变量驱动（setRootColors / changeMenuColor 同步 --color-* 与
  // --el-color-*），不再拉取并注入 Element UI 时代的 element-extra.css——那份样式里的
  // `.el-input__inner { border }` 正是 Element Plus 下输入框「border 套 border」的根源。
  setRootColors()
  changeMenuColor(themeColors)
  changeElementColor(themeColors)
}
