import { isPublicDemoProduct } from '../services/catalogService';

export const DEMO_WISHLIST_KEY = 'sellpoint_demo_wishlist_v1';
const UPDATED_EVENT = 'demoWishlistUpdated';

const readIds = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(DEMO_WISHLIST_KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.map(Number).filter(Number.isFinite))] : [];
  } catch {
    return [];
  }
};

const saveIds = ids => {
  window.localStorage.setItem(DEMO_WISHLIST_KEY, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new Event(UPDATED_EVENT));
  return [...new Set(ids)];
};

export const getDemoWishlistIds = () => readIds();

export const toggleDemoWishlistItem = productId => {
  const id = Number(productId);
  if (!Number.isFinite(id)) throw new Error('Choose a valid product.');
  const ids = readIds();
  return saveIds(ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
};

export const removeDemoWishlistItem = productId =>
  saveIds(readIds().filter(id => id !== Number(productId)));

export const getDemoWishlist = state => {
  const ids = readIds();
  return ids.map(productId => {
    const product = state.products.find(item => item.productId === productId);
    if (!product) return { productId, productName: 'Product no longer available', isAvailable: false, isMissing: true };
    const isPublic = isPublicDemoProduct(state, product);
    return {
      ...product,
      isAvailable: isPublic && Number(product.stockQuantity) > 0,
      isVisible: isPublic
    };
  });
};

export const isDemoWishlistItem = productId => readIds().includes(Number(productId));
export const DEMO_WISHLIST_UPDATED_EVENT = UPDATED_EVENT;
