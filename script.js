// EdgeCrash Tab Navigation
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-btn');
  const pages = document.querySelectorAll('.page');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      // Deactivate all tabs
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      // Hide all pages
      pages.forEach(p => p.classList.remove('active'));

      // Activate clicked tab
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show target page
      const targetPage = document.getElementById(`page-${targetId}`);
      if (targetPage) {
        targetPage.classList.add('active');
      }
    });
  });
});
