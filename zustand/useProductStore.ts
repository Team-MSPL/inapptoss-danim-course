import { create } from 'zustand';

export interface Product {
  _id: string;
  product: any;
}

export type SortType =
  | 'recommend'
  | 'price_desc'
  | 'price_asc'
  | 'score_desc'
  | 'score_asc';

export interface ProductFilter {
  departTime: string[];
  tourType: string[];
  guide: string[];
  minPrice: number;
  maxPrice: number;
}

interface ProductState {
  productList: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  sortType: SortType;
  filter: ProductFilter;
  setProductList: (products: Product[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSortType: (sort: SortType) => void;
  setFilter: (filter: Partial<ProductFilter>) => void;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  productList: [],
  total: 0,
  loading: false,
  error: null,
  sortType: 'recommend',
  filter: {
    departTime: [],
    tourType: [],
    guide: [],
    minPrice: 0,
    maxPrice: 1000000
  },
  setProductList: (products, total) => set({ productList: products, total }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSortType: (sort) => set({ sortType: sort }),
  setFilter: (filterPatch) =>
    set((state) => ({
      filter: {
        ...state.filter,
        ...filterPatch,
      },
    })),
  reset: () =>
    set({
      productList: [],
      total: 0,
      loading: false,
      error: null,
      sortType: 'recommend',
      filter: {
        departTime: [],
        tourType: [],
        guide: [],
        minPrice: 0,
        maxPrice: 1000000
      },
    }),
}));