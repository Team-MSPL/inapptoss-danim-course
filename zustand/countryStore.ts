import { create } from 'zustand';

type CountryStore = {
  selectedCountryKo: string | null;
  setSelectedCountryKo: (countryKo: string | null) => void;
};

export const useCountryStore = create<CountryStore>((set) => ({
  selectedCountryKo: null,
  setSelectedCountryKo: (countryKo: string | null) => set({ selectedCountryKo: countryKo }),
}));