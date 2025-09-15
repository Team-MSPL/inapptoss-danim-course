export type TimetableItem = {
    name: string;
    takenTime: number;
    y?: number;
    category?: number;
    formatted_address?: string;
    [key: string]: any;
};

export type TimetableDay = TimetableItem[];

export type TimetableState = TimetableDay[];

export const defaultTimetableItem: TimetableItem = {
    name: "",
    takenTime: 0,
    category: 0,
    formatted_address: "",
    y: 0,
};