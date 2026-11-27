const search = document.getElementById('page-search');
const pages = Array.from(document.querySelectorAll('#page-links li'));
search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  for (const page of pages) page.hidden = !page.textContent.toLowerCase().includes(query);
  document.getElementById('search-status').hidden = pages.some(page => !page.hidden);
});
