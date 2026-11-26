import { isPublicDemoProduct } from '../services/catalogService';

const text = value => String(value ?? '').trim();
const validPublicUrl = value => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isPublicDemoStore = vendor =>
  Boolean(vendor && vendor.status === 'Approved' && vendor.isActive);

export const getPublicDemoStores = state => (state.vendors || [])
  .filter(isPublicDemoStore)
  .map(vendor => {
    const products = (state.products || []).filter(product =>
      product.vendorId === vendor.vendorId && isPublicDemoProduct(state, product)
    );
    const reviews = (state.reviews || []).filter(review =>
      Number(review.vendorId) === Number(vendor.vendorId) && review.status === 'Approved'
    );
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
      : 0;
    return {
      ...vendor,
      publicProductCount: products.length,
      publicReviewCount: reviews.length,
      averageRating
    };
  })
  .sort((a, b) => a.businessName.localeCompare(b.businessName));

export const getPublicDemoStore = (state, vendorId) => {
  const vendor = (state.vendors || []).find(item =>
    Number(item.vendorId) === Number(vendorId) && isPublicDemoStore(item)
  );
  if (!vendor) return null;
  const summary = getPublicDemoStores(state).find(item => item.vendorId === vendor.vendorId);
  return { ...vendor, ...summary };
};

export const getPublicDemoStoreProducts = (state, vendorId, filters = {}) => {
  if (!getPublicDemoStore(state, vendorId)) return [];
  const search = text(filters.search).toLowerCase();
  const categoryId = filters.categoryId ? Number(filters.categoryId) : null;
  const products = (state.products || []).filter(product =>
    product.vendorId === Number(vendorId) &&
    isPublicDemoProduct(state, product) &&
    (!categoryId || Number(product.categoryId) === categoryId) &&
    (!search || [product.productName, product.description, product.categoryName]
      .some(value => text(value).toLowerCase().includes(search)))
  );
  const sortBy = filters.sortBy || 'newest';
  products.sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'name') return a.productName.localeCompare(b.productName);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  const pageSize = Math.max(1, Number(filters.pageSize) || 9);
  const page = Math.max(1, Number(filters.page) || 1);
  return {
    products: products.slice((page - 1) * pageSize, page * pageSize),
    totalCount: products.length,
    totalPages: Math.max(1, Math.ceil(products.length / pageSize)),
    categories: [...new Map(products.map(item => [item.categoryId, {
      categoryId: item.categoryId,
      categoryName: item.categoryName
    }])).values()]
  };
};

export const getPublicDemoStoreReviews = (state, vendorId) => {
  if (!getPublicDemoStore(state, vendorId)) return [];
  return (state.reviews || [])
    .filter(review => Number(review.vendorId) === Number(vendorId) && review.status === 'Approved')
    .map(review => ({ ...review }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const saveVendorStoreProfile = (state, vendorId, changes) => {
  const vendor = (state.vendors || []).find(item => Number(item.vendorId) === Number(vendorId));
  if (!vendor || !isPublicDemoStore(vendor)) {
    throw new Error('Only approved and active vendors can update their public store profile.');
  }
  const fields = {
    tagline: [changes.tagline, 120],
    description: [changes.description, 1500],
    logoUrl: [changes.logoUrl, 500],
    bannerUrl: [changes.bannerUrl, 500],
    publicEmail: [changes.publicEmail, 160],
    publicPhone: [changes.publicPhone, 40],
    city: [changes.city, 80],
    country: [changes.country, 80]
  };
  const profile = {};
  Object.entries(fields).forEach(([key, [value, max]]) => {
    const clean = text(value);
    if (clean.length > max) throw new Error(key + ' must be ' + max + ' characters or fewer.');
    profile[key] = clean;
  });
  if (profile.publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.publicEmail)) {
    throw new Error('Enter a valid public contact email.');
  }
  if (!validPublicUrl(profile.logoUrl) || !validPublicUrl(profile.bannerUrl)) {
    throw new Error('Store logo and banner must use valid HTTP or HTTPS image URLs.');
  }
  return {
    ...state,
    vendors: state.vendors.map(item => item.vendorId === vendor.vendorId
      ? { ...item, ...profile }
      : item)
  };
};
