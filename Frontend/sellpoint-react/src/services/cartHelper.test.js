import { addToCart, clearCart, getCart, removeItem, updateQuantity } from './cartHelper';

const product = {
  productId: 10, productName: 'Wireless Headphones', businessName: 'Nova Tech',
  vendorId: 101, price: 90, discountPercent: 10, stockQuantity: 5, isActive: true,
  variants: [
    { variantId: 101, variantName: 'Black', price: 90, stockQuantity: 2, options: { Color: 'Black' } },
    { variantId: 102, variantName: 'White', price: 100, stockQuantity: 3, options: { Color: 'White' } }
  ]
};

describe('cartHelper Demo variant support', () => {
  beforeEach(() => localStorage.clear());

  test('stores different variants as separate cart lines with their own price and stock', async () => {
    await addToCart(product, 2, product.variants[0]);
    await addToCart(product, 1, product.variants[1]);
    const items = await getCart();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ cartId: '10:101', variantId: 101, variantName: 'Black', price: 90, quantity: 2, stockQuantity: 2, itemTotal: 162 });
    expect(items[1]).toMatchObject({ cartId: '10:102', variantId: 102, variantName: 'White', price: 100, quantity: 1, stockQuantity: 3, itemTotal: 90 });
  });

  test('validates variant selection and per-variant stock', async () => {
    await expect(addToCart(product, 1)).rejects.toThrow(/select a product option/);
    await expect(addToCart(product, 3, product.variants[0])).rejects.toThrow(/Only 2 unit/);
  });

  test('updates and removes only the selected variant cart line', async () => {
    await addToCart(product, 1, product.variants[0]);
    await addToCart(product, 2, product.variants[1]);
    await expect(updateQuantity('10:102', 4)).rejects.toThrow(/Only 3 unit/);
    await updateQuantity('10:102', 1);
    await removeItem('10:101');
    expect(await getCart()).toMatchObject([{ cartId: '10:102', variantId: 102, quantity: 1, itemTotal: 90 }]);
    await clearCart();
    expect(await getCart()).toEqual([]);
  });
});
