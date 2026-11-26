import {
  deleteDemoCustomerAddress,
  getDemoCustomerAddresses,
  getDemoCustomerProfile,
  saveDemoCustomerAddress,
  setDemoDefaultAddress,
  updateDemoCustomerProfile
} from './demoCustomerAccountService';

const state = {
  customers: [
    { userId: 301, name: 'Mariam Shah', email: 'mariam@example.demo', phone: '03001234567' },
    { userId: 302, name: 'Daniyal Khan', email: 'daniyal@example.demo', phone: '03011234567' }
  ],
  addresses: [
    { addressId: 6001, customerId: 301, label: 'Home', recipientName: 'Mariam Shah', phone: '03001234567', addressLine1: '12 Model Town', city: 'Lahore', state: 'Punjab', zipCode: '54700', country: 'Pakistan', isDefault: true },
    { addressId: 6002, customerId: 301, label: 'Office', recipientName: 'Mariam Shah', phone: '03001234567', addressLine1: '8 Main Boulevard', city: 'Lahore', state: 'Punjab', zipCode: '54000', country: 'Pakistan', isDefault: false },
    { addressId: 6003, customerId: 302, label: 'Home', recipientName: 'Daniyal Khan', phone: '03011234567', addressLine1: '25 Gulgasht', city: 'Multan', state: 'Punjab', zipCode: '66000', country: 'Pakistan', isDefault: true }
  ]
};
const address = { label: 'Apartment', recipientName: 'Mariam Shah', phone: '03001234567', addressLine1: 'New Street 5', city: 'Lahore', state: 'Punjab', zipCode: '54000', country: 'Pakistan' };

describe('demoCustomerAccountService', () => {
  test('reads only the requested customer profile and addresses', () => {
    expect(getDemoCustomerProfile(state, 301).name).toBe('Mariam Shah');
    expect(getDemoCustomerAddresses(state, 301)).toHaveLength(2);
    expect(getDemoCustomerAddresses(state, 302)).toHaveLength(1);
    expect(() => getDemoCustomerProfile(state, 999)).toThrow(/not found/);
  });

  test('updates profile details and rejects invalid or duplicate email addresses', () => {
    const updated = updateDemoCustomerProfile(state, 301, { name: 'Mariam Ali', email: 'MARIAM@EXAMPLE.DEMO', phone: '03009998888' });
    expect(updated.customers[0]).toMatchObject({ name: 'Mariam Ali', email: 'mariam@example.demo', phone: '03009998888' });
    expect(state.customers[0].name).toBe('Mariam Shah');
    expect(() => updateDemoCustomerProfile(state, 301, { name: '', email: 'bad', phone: '' })).toThrow(/enter your name/);
    expect(() => updateDemoCustomerProfile(state, 301, { name: 'Mariam', email: 'bad', phone: '' })).toThrow(/valid email/);
    expect(() => updateDemoCustomerProfile(state, 301, { name: 'Mariam', email: 'daniyal@example.demo', phone: '' })).toThrow(/already used/);
  });

  test('adds addresses and makes the first address default', () => {
    const emptyState = { ...state, addresses: state.addresses.filter(item => item.customerId !== 301) };
    const added = saveDemoCustomerAddress(emptyState, 301, address);
    expect(added.addresses.find(item => item.customerId === 301)).toMatchObject({ label: 'Apartment', isDefault: true, addressLine1: 'New Street 5' });
  });

  test('edits addresses without changing other customers records', () => {
    const updated = saveDemoCustomerAddress(state, 301, { ...address, addressLine1: 'Updated Street' }, 6001);
    expect(updated.addresses.find(item => item.addressId === 6001).addressLine1).toBe('Updated Street');
    expect(updated.addresses.find(item => item.addressId === 6002).addressLine1).toBe('8 Main Boulevard');
    expect(updated.addresses.find(item => item.addressId === 6003).addressLine1).toBe('25 Gulgasht');
  });

  test('enforces one default address and allows choosing a different default', () => {
    const updated = saveDemoCustomerAddress(state, 301, { ...address, isDefault: true });
    const customerAddresses = getDemoCustomerAddresses(updated, 301);
    expect(customerAddresses.filter(item => item.isDefault)).toHaveLength(1);
    const defaultAddress = customerAddresses.find(item => item.isDefault);
    const changed = setDemoDefaultAddress(updated, 301, 6002);
    expect(getDemoCustomerAddresses(changed, 301).find(item => item.isDefault).addressId).toBe(6002);
    expect(defaultAddress).toBeTruthy();
  });

  test('deletes addresses and selects a replacement default when necessary', () => {
    const updated = deleteDemoCustomerAddress(state, 301, 6001);
    expect(getDemoCustomerAddresses(updated, 301)).toHaveLength(1);
    expect(getDemoCustomerAddresses(updated, 301)[0]).toMatchObject({ addressId: 6002, isDefault: true });
    expect(() => deleteDemoCustomerAddress(state, 301, 6003)).toThrow(/not found/);
    expect(() => setDemoDefaultAddress(state, 301, 6003)).toThrow(/not found/);
  });

  test('validates required address fields', () => {
    expect(() => saveDemoCustomerAddress(state, 301, { ...address, phone: '' })).toThrow(/complete the recipient/);
    expect(() => saveDemoCustomerAddress(state, 301, { ...address, addressLine1: '' })).toThrow(/complete the recipient/);
  });
});
