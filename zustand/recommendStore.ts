import { create } from 'zustand'

type RecommendBody = {
  cityList: string[];
  country: string;
  pathList: any[];    // server expects nested arrays, keep any[] for flexibility
  selectList: any[];  // array-of-arrays (tendency/selection vectors)
  topK: number;
  [k: string]: any;   // allow extra fields
};

type RecommendState = {
  recommendBody: RecommendBody;
  setRecommendBody: (body: Partial<RecommendBody> | RecommendBody) => void;
  updateRecommendPartial: (patch: Partial<RecommendBody>) => void;
  clearRecommendBody: () => void;
};

const DEFAULT_BODY: RecommendBody = {
  cityList: [],
  country: "",
  pathList: [[]],
  selectList: [[]],
  topK: 10,
};

export const useRecommendStore = create<RecommendState>((set, get) => ({
  recommendBody: DEFAULT_BODY,
  // Replace entire body or accept partial object (if you pass partial it will replace whole)
  setRecommendBody: (body) => {
    // if full shape passed (has topK or cityList), replace; otherwise merge
    const isFull = (b: any) => b && (b.cityList !== undefined || b.pathList !== undefined || b.topK !== undefined);
    if (isFull(body)) {
      set({ recommendBody: { ...DEFAULT_BODY, ...(body as RecommendBody) } });
    } else {
      // partial merge
      set((state: any) => ({ recommendBody: { ...state.recommendBody, ...(body as Partial<RecommendBody>) } }));
    }
  },
  updateRecommendPartial: (patch) => set((s: any) => ({ recommendBody: { ...s.recommendBody, ...patch } })),
  clearRecommendBody: () => set({ recommendBody: { ...DEFAULT_BODY } }),
}));

export default useRecommendStore;