export const getEmbedCode = (caseId, baseUrl = 'https://proofflow.ru') => {
  return `<div data-proofflow-case="${caseId}"></div>\n<script async defer src="${baseUrl}/embed.js"></script>`
}

export const CMS_INSTRUCTIONS = [
  {
    id: 'tilda',
    title: 'Tilda Publishing (блок T123)',
    steps: [
      'Добавьте блок T123 («HTML-код») в нужное место вашей страницы',
      'Нажмите «Контент» блока T123 и вставьте скопированный код',
      'Сохраните и опубликуйте страницу в Tilda',
    ],
  },
  {
    id: 'wordpress',
    title: 'WordPress (Gutenberg / Elementor)',
    steps: [
      'В редакторе страницы нажмите «+» и добавьте блок «Пользовательский HTML» (или HTML-виджет в Elementor)',
      'Вставьте скопированный код в поле блока',
      'Нажмите «Обновить» или «Опубликовать»',
    ],
  },
  {
    id: 'webflow',
    title: 'Webflow (Embed Component)',
    steps: [
      'Перетащите элемент «Embed» (HTML Embed Code Editor) из панели компонентов в нужную секцию',
      'Вставьте скопированный embed-код в окно редактора',
      'Нажмите «Save & Close» и опубликуйте проект',
    ],
  },
]
