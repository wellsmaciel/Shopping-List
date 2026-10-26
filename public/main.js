// Theme Toggle. The inline script in index.html applies the saved theme early;
// this keeps the button and the saved choice in step.
{
  const themeButton = document.getElementById('theme-button');
  const htmlFile = document.documentElement;

  function showTheme() {
    themeButton.setAttribute('aria-pressed', String(htmlFile.getAttribute('color-mode') === 'dark'));
  }

  themeButton.addEventListener('click', function () {
    const next = htmlFile.getAttribute('color-mode') === 'dark' ? 'light' : 'dark';
    htmlFile.setAttribute('color-mode', next);
    try {
      localStorage.setItem('theme', next);
    } catch (error) {
      // Storage unavailable: the choice just is not remembered.
    }
    showTheme();
  });
  showTheme();
}

// Footer version: v + major.minor from the API
async function showVersion() {
  try {
    const { version } = await api('/api/version');
    const [major, minor] = version.split('.');
    document.getElementById('app-version').textContent = `v${major}.${minor}`;
  } catch (error) {
    // The footer simply omits the version.
  }
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

let unitCodes = [];

// Fills a select with one option per Unit code, labelled in the Interface Language.
function fillUnitOptions(select) {
  select.innerHTML = '';
  unitCodes.forEach((code) => {
    const option = document.createElement('option');
    option.value = code;
    option.dataset.i18n = `unit.${code}`;
    option.textContent = i18n.t(`unit.${code}`);
    select.appendChild(option);
  });
}

async function loadUnits() {
  unitCodes = await api('/api/units');
  fillUnitOptions(unitSelect);
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

// Update item. Resolves true on success; on failure shows the error and resolves false.
async function updateItem(id, itemData) {
  try {
    await api(`/api/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
  } catch (error) {
    reportError(error);
    return false;
  }
  showMessage('success.updated');
  await renderGroceryList();
  return true;
}

// Set or clear In Cart. Always re-renders so the list shows the API's order
// (and a failed change reverts the checkbox).
async function setInCart(id, inCart) {
  try {
    await api(`/api/items/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ in_cart: inCart }),
    });
  } catch (error) {
    reportError(error);
  }
  await renderGroceryList();
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

// Builds a labelled field for the inline edit form. The label is visually hidden.
function editField(labelKey, control) {
  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.dataset.i18n = labelKey;
  label.textContent = i18n.t(labelKey);
  control.id = `edit-${labelKey.split('.')[1]}`;
  label.htmlFor = control.id;
  const wrapper = document.createElement('div');
  wrapper.appendChild(label);
  wrapper.appendChild(control);
  return wrapper;
}

function editButton(className, key, type) {
  const button = document.createElement('button');
  button.type = type;
  button.className = className;
  button.dataset.i18n = key;
  button.textContent = i18n.t(key);
  return button;
}

// Swaps an Item row for an inline form pre-filled with its values.
// Only one row is editable at a time: opening another edit re-renders the list.
async function startEdit(item) {
  await renderGroceryList();
  const row = document.querySelector(`#result li[data-id="${item.id}"]`);
  if (!row) return;

  const form = document.createElement('form');
  form.className = 'edit-form';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = item.name;
  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.step = '1';
  quantityInput.value = item.quantity;
  const unitInput = document.createElement('select');
  fillUnitOptions(unitInput);
  unitInput.value = item.unit;

  form.appendChild(editField('edit.name', nameInput));
  form.appendChild(editField('edit.quantity', quantityInput));
  form.appendChild(editField('edit.unit', unitInput));
  form.appendChild(editButton('update-button', 'button.save', 'submit'));
  const cancelButton = editButton('cancel-button', 'button.cancel', 'button');
  form.appendChild(cancelButton);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    updateItem(item.id, {
      name: nameInput.value,
      quantity: parseInt(quantityInput.value, 10),
      unit: unitInput.value,
    });
  });
  cancelButton.addEventListener('click', function () {
    renderGroceryList();
  });

  row.innerHTML = '';
  row.appendChild(form);
  nameInput.focus();
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
    const updateButton = document.createElement('button');
    const groceryContainer = document.createElement('div');
    const itemtextContainer = document.createElement('div');
    const itemDetailsContainer = document.createElement('div');
    const checkboxContainer = document.createElement('div');
    const btnsContainer = document.createElement('div');

    const checkboxLabelText = document.createElement('span');

    listItem.dataset.id = item.id;
    listItem.dataset.inCart = item.in_cart;
    checkbox.type = 'checkbox';
    checkbox.checked = item.in_cart;
    checkboxLabelText.className = 'visually-hidden';
    checkboxLabelText.dataset.i18n = 'item.inCart';
    checkboxLabelText.textContent = i18n.t('item.inCart');
    // Accessible name: "In cart:" (translated) followed by the visible Item name.
    checkboxLabelText.id = `in-cart-label-${item.id}`;
    itemtextContainer.id = `item-name-${item.id}`;
    checkbox.setAttribute('aria-labelledby', `${checkboxLabelText.id} ${itemtextContainer.id}`);
    checkboxContainer.className = 'checkbox-container';
    groceryContainer.className = 'grocery-item';
    btnsContainer.className = 'buttons-container';
    updateButton.className = 'update-button';
    updateButton.dataset.i18n = 'button.update';
    updateButton.textContent = i18n.t('button.update');
    deleteButton.className = 'delete-button';
    deleteButton.dataset.i18n = 'button.delete';
    deleteButton.textContent = i18n.t('button.delete');
    unitLabel.dataset.i18n = `unit.${item.unit}`;
    unitLabel.textContent = i18n.t(`unit.${item.unit}`);
    itemDetailsContainer.className = 'item-details';
    itemtextContainer.className = 'item-text';

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxLabelText);
    listItem.appendChild(checkboxContainer);
    groceryContainer.appendChild(itemtextContainer);
    groceryContainer.appendChild(itemDetailsContainer);
    listItem.appendChild(groceryContainer);
    itemtextContainer.appendChild(itemtext);
    itemDetailsContainer.appendChild(quantityText);
    itemDetailsContainer.appendChild(unitLabel);
    list.appendChild(listItem);
    btnsContainer.appendChild(updateButton);
    btnsContainer.appendChild(deleteButton);
    listItem.appendChild(btnsContainer);

    checkbox.addEventListener('change', function () {
      setInCart(item.id, checkbox.checked);
    });
    updateButton.addEventListener('click', function () {
      startEdit(item);
    });
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
  showVersion();
})();
