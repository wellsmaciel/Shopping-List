// Theme Toggle
{
  const themeButton = document.getElementById('theme-button');
  const htmlFile = document.documentElement;

  themeButton.addEventListener('click', function () {
    let currentTheme = htmlFile.getAttribute('color-mode');

    if (currentTheme === 'light') {
      htmlFile.setAttribute('color-mode', 'dark');
    } else {
      htmlFile.setAttribute('color-mode', 'light');
    }
  });
}

// Interface Language
{
  document.getElementById('language-button').addEventListener('click', function () {
    i18n.toggle().catch((error) => console.error('Error:', error));
  });
}

// Messages: shown in the live region, always chosen by language key so that
// they re-render when the Interface Language changes.
const messageRegion = document.getElementById('message');

function showMessage(key) {
  messageRegion.dataset.i18n = key;
  messageRegion.textContent = i18n.t(key);
}

// Calls the API. Resolves with the parsed JSON body (null for 204).
// Rejects with an Error whose messageKey names the language-file entry to show.
async function api(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw Object.assign(error, { messageKey: 'error.network' });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const key = `error.${body.code}`;
    const known = body.code && i18n.t(key) !== key;
    throw Object.assign(new Error(`Request failed (${response.status})`), {
      messageKey: known ? key : 'error.server_error',
    });
  }

  return response.status === 204 ? null : response.json();
}

function reportError(error) {
  console.error('Error:', error);
  showMessage(error.messageKey || 'error.server_error');
}

// Unit select, built from the server's list of Unit codes
const unitSelect = document.getElementById('itemType');

async function loadUnits() {
  const units = await api('/api/units');
  unitSelect.innerHTML = '';
  units.forEach((code) => {
    const option = document.createElement('option');
    option.value = code;
    option.dataset.i18n = `unit.${code}`;
    option.textContent = i18n.t(`unit.${code}`);
    unitSelect.appendChild(option);
  });
}

// Clear List Button, with an in-page confirm step
{
  const clearButton = document.getElementById('clear-btn');
  const confirmBox = document.getElementById('clear-confirm');

  function setConfirming(confirming) {
    confirmBox.hidden = !confirming;
    clearButton.hidden = confirming;
  }

  clearButton.addEventListener('click', function () {
    setConfirming(true);
  });
  document.getElementById('clear-cancel-btn').addEventListener('click', function () {
    setConfirming(false);
  });
  document.getElementById('clear-confirm-btn').addEventListener('click', function () {
    setConfirming(false);
    clearList();
  });
}

// API interaction functions

// Handle form submission to add new item
document.getElementById('list-form').addEventListener('submit', function (event) {
  event.preventDefault();
  createItem({
    name: document.getElementById('item').value,
    quantity: parseInt(document.getElementById('quantity').value, 10),
    unit: unitSelect.value,
  });
});

//Create new item
async function createItem(itemData) {
  try {
    await api('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    document.getElementById('list-form').reset();
    showMessage('success.added');
    await renderGroceryList();
  } catch (error) {
    reportError(error);
  }
}

//Delete item
async function deleteItem(id) {
  try {
    await api(`/api/items/${id}`, { method: 'DELETE' });
    showMessage('success.deleted');
  } catch (error) {
    reportError(error);
  }
  await renderGroceryList();
}

//Clear entire list
async function clearList() {
  try {
    await api('/api/items', { method: 'DELETE' });
    showMessage('success.cleared');
  } catch (error) {
    reportError(error);
  }
  await renderGroceryList();
}

// Fetch and render grocery list from the server
async function renderGroceryList() {
  let data;
  try {
    data = await api('/api/items');
  } catch (error) {
    reportError(error);
    return;
  }

  const list = document.getElementById('result'); // Clear existing list items
  list.innerHTML = '';

  data.forEach((item) => {
    const listItem = document.createElement('li');
    const checkbox = document.createElement('input');
    const itemtext = document.createTextNode(item.name);
    const quantityText = document.createTextNode(`${item.quantity} - `);
    const unitLabel = document.createElement('span');
    const deleteButton = document.createElement('button');
    const groceryContainer = document.createElement('div');
    const itemtextContainer = document.createElement('div');
    const itemDetailsContainer = document.createElement('div');
    const checkboxContainer = document.createElement('div');
    const btnsContainer = document.createElement('div');

    checkbox.type = 'checkbox';
    checkboxContainer.className = 'checkbox-container';
    groceryContainer.className = 'grocery-item';
    btnsContainer.className = 'buttons-container';
    deleteButton.className = 'delete-button';
    deleteButton.dataset.i18n = 'button.delete';
    deleteButton.textContent = i18n.t('button.delete');
    unitLabel.dataset.i18n = `unit.${item.unit}`;
    unitLabel.textContent = i18n.t(`unit.${item.unit}`);
    itemDetailsContainer.className = 'item-details';
    itemtextContainer.className = 'item-text';

    checkboxContainer.appendChild(checkbox);
    listItem.appendChild(checkboxContainer);
    groceryContainer.appendChild(itemtextContainer);
    groceryContainer.appendChild(itemDetailsContainer);
    listItem.appendChild(groceryContainer);
    itemtextContainer.appendChild(itemtext);
    itemDetailsContainer.appendChild(quantityText);
    itemDetailsContainer.appendChild(unitLabel);
    list.appendChild(listItem);
    btnsContainer.appendChild(deleteButton);
    listItem.appendChild(btnsContainer);

    deleteButton.addEventListener('click', function () {
      deleteItem(item.id);
    });
  });
}

// Start: language first (so labels exist), then the Units, then the list
(async function start() {
  await i18n.init();
  try {
    await loadUnits();
  } catch (error) {
    reportError(error);
  }
  await renderGroceryList();
})();
