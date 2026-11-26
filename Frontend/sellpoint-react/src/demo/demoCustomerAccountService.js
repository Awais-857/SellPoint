const normalizeText = value => String(value ?? '').trim();

export const getDemoCustomerProfile = (state, customerId) => {
  const customer = state.customers.find(item => item.userId === Number(customerId));
  if (!customer) throw new Error('Customer profile not found.');
  return { ...customer };
};

export const updateDemoCustomerProfile = (state, customerId, changes) => {
  const customer = getDemoCustomerProfile(state, customerId);
  const name = normalizeText(changes.name);
  const email = normalizeText(changes.email).toLowerCase();
  const phone = normalizeText(changes.phone);
  if (!name) throw new Error('Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (state.customers.some(item => item.userId !== Number(customerId) && normalizeText(item.email).toLowerCase() === email)) {
    throw new Error('This email address is already used by another demo customer.');
  }
  return {
    ...state,
    customers: state.customers.map(item => item.userId === Number(customerId)
      ? { ...item, name, email, phone }
      : item)
  };
};

export const getDemoCustomerAddresses = (state, customerId) =>
  (state.addresses || []).filter(item => item.customerId === Number(customerId)).map(item => ({ ...item }));

const validateAddress = address => {
  const result = {
    label: normalizeText(address.label) || 'Home',
    recipientName: normalizeText(address.recipientName),
    phone: normalizeText(address.phone),
    addressLine1: normalizeText(address.addressLine1),
    addressLine2: normalizeText(address.addressLine2),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    zipCode: normalizeText(address.zipCode),
    country: normalizeText(address.country) || 'Pakistan'
  };
  if (!result.recipientName || !result.phone || !result.addressLine1 || !result.city || !result.state || !result.zipCode || !result.country) {
    throw new Error('Please complete the recipient, phone, street, city, province, postal code and country fields.');
  }
  return result;
};

export const saveDemoCustomerAddress = (state, customerId, address, addressId = null) => {
  const existing = getDemoCustomerAddresses(state, customerId);
  const current = addressId == null ? null : existing.find(item => item.addressId === Number(addressId));
  if (addressId != null && !current) throw new Error('Address not found in this customer account.');
  const values = validateAddress(address);
  const nextId = Math.max(6000, ...(state.addresses || []).map(item => Number(item.addressId) || 0)) + 1;
  const saved = {
    ...(current || {}),
    ...values,
    addressId: current?.addressId ?? nextId,
    customerId: Number(customerId)
  };
  const remaining = existing.filter(item => item.addressId !== saved.addressId);
  const currentDefaultId = existing.find(item => item.isDefault)?.addressId;
  const defaultAddressId = Boolean(address.isDefault) || existing.length === 0
    ? saved.addressId
    : currentDefaultId === saved.addressId
      ? (remaining[0]?.addressId ?? saved.addressId)
      : (currentDefaultId ?? saved.addressId);
  const customerAddresses = [...remaining, saved].map(item => ({
    ...item,
    isDefault: item.addressId === defaultAddressId
  }));
  return {
    ...state,
    addresses: [
      ...(state.addresses || []).filter(item => item.customerId !== Number(customerId)),
      ...customerAddresses
    ]
  };
};

export const deleteDemoCustomerAddress = (state, customerId, addressId) => {
  const existing = getDemoCustomerAddresses(state, customerId);
  const target = existing.find(item => item.addressId === Number(addressId));
  if (!target) throw new Error('Address not found in this customer account.');
  const remaining = existing.filter(item => item.addressId !== target.addressId);
  if (target.isDefault && remaining.length) remaining[0] = { ...remaining[0], isDefault: true };
  return {
    ...state,
    addresses: [
      ...(state.addresses || []).filter(item => item.customerId !== Number(customerId)),
      ...remaining
    ]
  };
};

export const setDemoDefaultAddress = (state, customerId, addressId) => {
  const existing = getDemoCustomerAddresses(state, customerId);
  if (!existing.some(item => item.addressId === Number(addressId))) throw new Error('Address not found in this customer account.');
  return {
    ...state,
    addresses: [
      ...(state.addresses || []).filter(item => item.customerId !== Number(customerId)),
      ...existing.map(item => ({ ...item, isDefault: item.addressId === Number(addressId) }))
    ]
  };
};
