/** Theme identity is appearance only: capabilities and saved accounts do not read it. */
export const themes = Object.freeze({
  night: { label:'Night desk', tokens:['background','surface','raised','text','muted','border','accent','reported','observed','focus','heading-font','body-font','motion'] },
  paper: { label:'Reading room', tokens:['background','surface','raised','text','muted','border','accent','reported','observed','focus','heading-font','body-font','motion'] }
});
export function applyTheme(name, root = document.documentElement) {
  if (!Object.hasOwn(themes,name)) throw new Error('Unknown interface theme.');
  root.dataset.theme=name;
}
